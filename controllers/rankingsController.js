const Match = require('../models/match');
const Wrestler = require('./../models/wrestler');
const Show = require('./../models/show');
const showController = require('../controllers/showController');
const APIFeatures = require('../utils/apiFeatures');
const Team = require('./../models/team');

function calcShowMod(show, match, win) {
  var showMod = 1;
  if (
    show.name.includes('Dark') ||
    show.name.includes('Elevation') ||
    show.name.includes('Tournament')
  ) {
    // startingPower = 100;
    showMod = 0.5;
  } else if (match.matchType.toLowerCase().includes('dark')) {
    showMod = 0.25;
  } else if (show.ppv) {
    if (win && match.mainEvent) {
      showMod = 1.5;
    } else if (match.preshow) {
      showMod = 1.15;
    } else if (win && !match.mainEvent) {
      showMod = 1.25;
    } else if (!win && match.mainEvent) {
      showMod = 0.8;
    } else if (!win && !match.mainEvent) {
      showMod = 0.9;
    }
  }
  return showMod;
}

function calcWrestlerPower(wrestler, currentDate) {
  //IDEA: modifier based on how long boosts is, ie how many matches a person/team has had
  //weight more heavily towards people with more matches?
  //at least teams, i guess - skew a bit towards long-running teams?
  //maybe not. i think orange/trent is an outlier

  var team = wrestler.wrestlers !== undefined;
  var currentPower = 0 + wrestler.startPower;
  //this now returns an OBJECT so that it can also return the gap of time since the last match. this will be used to inactive people after 12 weeks (84 days)
  var timeGap = 0;
  for (let boost of wrestler.boosts) {
    var modifier = 1;
    var ppvModifier = 1;
    var teamModifier = 1;
    var winModifier = 1;

    var daysSince = Math.round(
      (currentDate.getTime() - boost.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 365) {
      modifier = 0.01;
      ppvModifier = 1.15;
      timeGap = 365;
    } else if (daysSince >= 140) {
      modifier = 0.01;
      ppvModifier = 1.15;
      timeGap = 140;
    } else if (daysSince >= 112) {
      modifier = 0.025;
      ppvModifier = 1.15;
      timeGap = 112;
    } else if (daysSince >= 84) {
      modifier = 0.075;
      ppvModifier = 1.1;
      timeGap = 84;
    } else if (daysSince >= 56) {
      modifier = 0.15;
      ppvModifier = 1.1;
      timeGap = 56;
    } else if (daysSince >= 28) {
      modifier = 0.25;
      ppvModifier = 1.15;
      timeGap = 28;
    } else if (daysSince >= 14) {
      modifier = 0.5;
      ppvModifier = 1.15;
      timeGap = 14;
    } else if (daysSince >= 7) {
      modifier = 1;
      ppvModifier = 1.25;
      winModifier = 1.25;
      // teamModifier = 0.9;
      timeGap = 7;
    } else {
      modifier = 2.25;
      ppvModifier = 1.5;
      winModifier = 1.25;
      // teamModifier = 0.75;
    }
    var finalBoost = boost.startPower * boost.showMod;
    if (boost.showMod > 1) {
      finalBoost = finalBoost * ppvModifier;
    }
    if (boost.win == 1) {
      finalBoost = finalBoost * winModifier;
      if (boost.titleMod > 1) {
        finalBoost = finalBoost * (boost.titleMod * 1);
      } else if (boost.titleMod > 1.5) {
        finalBoost = finalBoost * (boost.titleMod * 1.1);
      }
    } else if (boost.titleMod > 1) {
      // var titleMod = 1 + Math.abs(boost.titleMod - 1) * 0.75;
      finalBoost = finalBoost * boost.titleMod * 1.1;
      if (boost.titleMod > 1.5) {
        finalBoost = finalBoost * boost.titleMod;
      }
    }
    finalBoost = finalBoost * modifier;
    currentPower += finalBoost;
    if (
      currentPower === null ||
      currentPower === NaN ||
      currentPower === Number.NEGATIVE_INFINITY
    ) {
      console.log('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
      console.log(wrestler.boosts[wrestler.boosts.length - 1]);
      throw new Error('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
    }
  }
  calcReturn = {
    power: currentPower,
    timeGap: timeGap,
  };
  return calcReturn;
}

function calcStreak(wres, power) {
  var debugName = 'ftr';
  var streak = 0;
  var worldStreak = 0;
  var secondaryStreak = 0;
  var lastResult = null;
  var lastTitleResult = null;
  var wresSize = 1;
  var streakStop = false;
  var titleStreakStop = false;
  var matchingCount = 0;
  var singlesCount = 0;
  var titleCount = 0;
  if (wres.wrestlers) {
    wresSize = wres.wrestlers.length;
  }

  var whichTitleBuffs = 0;

  //it should go backwards thru the last 15 matches to find the last 5 matches of the proper size and the last 5 title matches
  for (
    let i = wres.boosts.length - 1;
    i > wres.boosts.length - 16 && i >= 0;
    i--
  ) {
    var boost = wres.boosts[i];
    if (
      debugName &&
      i == wres.boosts.length - 1 &&
      wres.name.toLowerCase() == debugName
    ) {
      console.log(boost);
      console.log(
        `${debugName} | I: ${i}/${wres.boosts.length - 1} | DATE: ${boost.date}`
      );
    }

    if (wresSize == boost.sideSize) {
      matchingCount++;

      if (lastResult !== null && boost.win !== lastResult) {
        streakStop = true;
      }

      if (!streakStop) {
        if (singlesCount < 10) {
          lastResult = boost.win;
          singlesCount++;
          streak++;
        }
      }
      if (boost.titleMod > 1 && titleCount < 5) {
        // it goes BACKWARDS, not FORWARDS, so it has to stop the moment the win result stops matching
        if (lastTitleResult !== null && lastTitleResult !== boost.win) {
          titleStreakStop = true;
        }
        if (titleStreakStop) {
          continue;
        }
        lastTitleResult = boost.win;
        secondaryStreak = 0;
        worldStreak = 0;
        if (boost.titleMod == 1.25) {
          if (secondaryStreak < 5) {
            secondaryStreak++;
          }
          whichTitleBuffs = 1;
        } else if (boost.titleMod == 1.5) {
          if (worldStreak < 5) {
            worldStreak++;
          }
          whichTitleBuffs = 2;
        }
        titleCount++;
      }
      if (wres.name.toLowerCase() == debugName) {
        console.log(
          `${debugName} | ${streak} | I: ${i}/${wres.boosts.length - 1} | LR: ${lastResult} | WIN: ${boost.win} | DATE: ${boost.date} | TITLE: ${boost.titleMod} | STARTPOWER: ${boost.startPower}`
        );
      }
    }
    if ((singlesCount >= 5 && titleCount >= 5) || matchingCount >= 15) {
      break;
    }
  }
  //arr 1: debuffs for losing streak. arr 2: buffs for winning streak
  var buffs = [
    [-0.1, -0.15, -0.2, -0.25, -0.3, -0.35, -0.4, -0.5, -0.5],
    [0.05, 0.06, 0.08, 0.1, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
  ];
  //arr 1: buffs for no title streak - ie all 1. arr 2: secondary titles. arr 3: world titles
  var titleBuffs = [
    [0, 0, 0, 0, 0, 0],
    [0, 0.05, 0.07, 0.1, 0.14, 0.2],
    [0, 0.15, 0.16, 0.18, 0.2, 0.25],
  ];
  var titleStreak = 0;
  if (worldStreak > 0) {
    titleStreak = worldStreak;
  } else if (secondaryStreak > 0) {
    titleStreak = secondaryStreak;
  }

  //if it gets here without any sort of streak, just gotta ensure it doesn't have a negative number and that lastresult isn't null
  var streakMod = 0;
  if (lastResult !== null) {
    streakMod = buffs[lastResult][streak - 1];
  }
  var titleMod = titleBuffs[whichTitleBuffs][titleStreak];
  if (lastTitleResult == 0) {
    titleMod = titleMod * -1;
  }
  power = power * (1 + streakMod) * (1 + titleMod);

  return power;
}

exports.calcRankings = async (req, res) => {
  try {
    const features = new APIFeatures(Show.find(), req.query)
      .filter()
      .sort('date')
      .limitFields();
    // await executes the query and returns all the documents
    const shows = await features.query;
    var latestDate = null;
    var showCount = 0;
    var wresMap = new Map();
    var teams = await Team.find();
    var teamMap = new Map();
    for (let team of teams) {
      //reset the boosts on the teams every time - since we're pulling from the DB for these, gotta make sure the slate is clean
      team.startPower = 5000;
      team.boosts = [];
      teamMap.set(JSON.stringify(team.wrestlers.sort()), team);
    }
    for (let show of shows) {
      var startingPower = 5000;
      latestDate = show.date;
      showCount++;
      //use this to end the calc prematurely if we're testing
      // if (showCount > 20) {
      //   break;
      // }
      if (showCount == 1 || showCount % 50 == 0 || showCount == shows.length) {
        console.log(`Calculating show ${showCount}...`);
      }
      for (let mId of show.matches) {
        const match = await Match.findById(mId).populate({
          path: 'winner loser',
          model: Wrestler,
        });

        // k-factor affects how much of each guy's points is up for grabs in any given match
        //startingPower/ 5, on a flat 5000v5000 matchup, would put 10% of each side on the line
        // reducing the kfactor divisor increases the point movement
        // a higher kfactor divisor means less power on the line
        const kFactor = startingPower / 8;
        //x-factor affects the change brought on by the difference between winner and loser
        // a higher number seems to lead to bigger changes, but not by a ton

        const xFactor = startingPower / 4;

        var titleMod = 1;
        if (match.title.length > 0) {
          titleMod = 1.25;
          if (
            match.title[0] == '660f3be7b82fe2310454972d' || //world title
            match.title[0] == '660f3be7b82fe23104549747' || //women's world title
            match.title[0] == '660f3be7b82fe23104549847' //world tag team title
          ) {
            titleMod = 1.5;
          } else if (match.title[0] == '660f3be9b82fe2310454a1ec') {
            //the FTW title has a small mod and doesn't trigger title streaks. it's non-sanctioned!
            titleMod = 1.05;
          }
        }

        /*
          it needs to average every SIDE in a match, then be able to average all the SIDES except the one it's currently calculating
          in team situations, it can apply the same expchange to both teammates - calced based on their average together
        */
        var winnerAvg;
        var loserAvg;

        var winnerSide = {
          teamKey: null,
          names: [],
          powers: [],
          avgPower: 0,
        };
        var winnerIDs = [];
        for (let w of match.winner) {
          if (w === null) {
            continue;
          }
          winnerIDs.push(w._id);
          if (!wresMap.has(w.name)) {
            var newWres = {
              name: w.name,
              power: startingPower,
              startPower: startingPower,
              boosts: [],
              id: w._id,
            };
            if (!w.allElite) {
              newWres.power = 2000;
              newWres.startPower = 2000;
            }
            wresMap.set(w.name, newWres);
          }
          winnerSide.names.push(w.name);
          var wres = wresMap.get(w.name);
          if (wres.boosts.length > 0) {
            //if the wrestler has any boosts, then calculate their most recent power - BEFORE adding it to the average used to rate the newest boost
            wres.power = calcWrestlerPower(wres, show.date).power;
          }
          winnerSide.powers.push(wres.power);
          wresMap.set(w.name, wres);
          var powerSum = winnerSide.powers.reduce((a, b) => a + b, 0);
          winnerSide.avgPower = powerSum / winnerSide.powers.length;
        }
        var winnerKey = JSON.stringify(winnerIDs.sort());
        //this should change what it's calcing with if a team exists
        if (teamMap.has(winnerKey)) {
          var team = teamMap.get(winnerKey);
          team.male = match.winner[0].male;
          teamMap.set(winnerKey, team);
          if (team.startPower == null || team.startPower === undefined) {
            team.startPower = startingPower;
          }
          team.power = calcWrestlerPower(team, show.date).power;
          teamMap.set(winnerKey, team);
          winnerSide.teamKey = winnerKey;
          winnerSide.avgPower = team.power;
        }
        var loserSides = [];
        for (let w2 of match.loser) {
          /*
          it has to be able to work with existing teams, random teams, and single guys

          so - first check if it's a team. if not, it progresses exactly as it currently is

          if it IS, it has to use that team as the newLoser. save the keystring, use the team's power as avgpower
          */
          var newLoser = {
            teamKey: null,
            names: [],
            powers: [],
            avgPower: 0,
          };
          var loserIDs = [];
          for (let w of w2) {
            if (w === null) {
              continue;
            }
            loserIDs.push(w._id);
            //wrestler not there yet - makes new map entry
            if (!wresMap.has(w.name)) {
              var newWres = {
                name: w.name,
                power: startingPower,
                startPower: startingPower,
                boosts: [],
                id: w._id,
              };
              if (!w.allElite) {
                newWres.power = 1000;
                newWres.startPower = 1000;
              }
              if (!wresMap.has(w.name)) {
                wresMap.set(w.name, newWres);
              }
            }
            var wres = wresMap.get(w.name);
            newLoser.names.push(w.name);

            if (wres.boosts.length > 0) {
              wres.power = calcWrestlerPower(wres, show.date).power;
            }
            newLoser.powers.push(wres.power);
            wresMap.set(w.name, wres);
          }
          var powerSum = newLoser.powers.reduce((a, b) => a + b, 0);
          newLoser.avgPower = powerSum / newLoser.powers.length;
          var loserKey = JSON.stringify(loserIDs.sort());
          if (teamMap.has(loserKey)) {
            var team = teamMap.get(loserKey);
            if (team.male === undefined) {
              team.male = w2[0].male;
              teamMap.set(loserKey, team);
            }
            if (team.startPower == null || team.startPower === undefined) {
              team.startPower = startingPower;
            }
            team.power = calcWrestlerPower(team, show.date).power;
            teamMap.set(loserKey, team);
            newLoser.teamKey = loserKey;
            newLoser.avgPower = team.power;
          }
          loserSides.push(newLoser);
        }

        //okay, team-wise: at this point the avgs for each side should be EITHER the average of the wrestlers, OR the power of the team used.
        //if it's one guy: it'll just average one thing, it'll work normally
        //the challenge from here is percent modifiers based on if it's singles, random tag, or team tag

        for (let w of match.winner) {
          if (w === null) {
            continue;
          }
          //calc expwin based on the average of all the losers
          var loserSum = 0;
          for (let loser of loserSides) {
            loserSum += loser.avgPower;
          }
          var expWin =
            1 / (1 + (10 ^ (loserSum / loserSides.length / xFactor)));
          const wres = wresMap.get(w.name);

          var showMod = calcShowMod(show, match, true);
          var powChange = titleMod * kFactor * (1 - expWin) * showMod;

          if (wres.boosts === undefined) {
            wres.boosts = [];
          }
          var singleChange = 0 + powChange;
          var team = null;
          if (winnerSide.teamKey) {
            team = teamMap.get(winnerSide.teamKey);
          }
          if (team) {
            //if there's a matching team, then the single power is cut in half and a boost is created for the team
            //the team in the map is also updated
            singleChange = powChange * 0.1;
            //FIRST THINGS FIRST. we need to check if this boost already exists, so it doesn't get added for every member of the team

            var newBoost = {
              startPower: powChange,
              win: 1,
              sideSize: match.winner.length,
              showMod: showMod,
              titleMod: titleMod,
              date: show.date,
            };
            var newBoostString = JSON.stringify(newBoost);
            var found = false;
            for (let b of team.boosts) {
              var b2 = {
                startPower: b.startPower,
                win: b.win,
                sideSize: b.sideSize,
                showMod: b.showMod,
                titleMod: b.titleMod,
                date: b.date,
              };
              if (JSON.stringify(b2) == newBoostString) {
                found = true;
                break;
              }
            }
            if (!found) {
              team.boosts.push(newBoost);
            }
            teamMap.set(winnerSide.teamKey, team);
          } else if (match.winner.length > 1) {
            //if it's a tag match but it isn't an established team, then it's 50%
            singleChange = powChange * 0.5;
          }
          newBoost = {
            startPower: singleChange,
            win: 1,
            sideSize: match.winner.length,
            showMod: showMod,
            titleMod: titleMod,
            date: show.date,
          };
          wres.boosts.push(newBoost);

          if (wres.power === Number.NEGATIVE_INFINITY) {
            console.log('---BROKE HERE---');
            console.log(`${show.name} ---- ${show.date}`);
            console.log(`${w.name}`);
            console.log('WINNER');
            throw err;
          }
          wresMap.set(wres.name, {
            name: wres.name,
            power: wres.power,
            startPower: wres.startPower,
            boosts: wres.boosts,
            id: wres.id,
          });
          // console.log(`${w.name} POWER = ${w.power}`);
        }
        for (let w2 of match.loser) {
          //this one's harder. it has to calc the average power of every side EXCEPT THE CURRENT ONE.
          var opponentPowers = [winnerSide.avgPower];
          var opponentCount = 1;
          for (let w of w2) {
            if (w === null) {
              continue;
            }
            var isCurrentSide = false;
            //gotta calc for team up here - when scanning thru losersides, once you find the matching side you check it for a team and grab it if so
            var team = null;
            var teamKey = null;

            //this only adds losersides that AREN'T the one we're wokring on to the average

            for (let loser of loserSides) {
              for (let name of loser.names) {
                if (name == w.name) {
                  isCurrentSide = true;
                  break;
                }
              }
              if (isCurrentSide) {
                if (loser.teamKey) {
                  teamKey = loser.teamKey;
                  team = teamMap.get(loser.teamKey);
                }
                break;
              }
              opponentPowers.push(loser.avgPower);
              opponentCount++;
            }
            var powerSum = opponentPowers.reduce((a, b) => a + b, 0);
            var expWin = 1 / (1 + (10 ^ (powerSum / opponentCount / xFactor)));
            const wres = wresMap.get(w.name);
            var showMod = calcShowMod(show, match, false);
            var powChange = titleMod * kFactor * (0 - expWin) * showMod;

            if (wres.boosts === undefined) {
              wres.boosts = [];
            }

            var singleChange = 0 + powChange;
            if (team) {
              //if there's a matching team, then the single power is cut to a quarter and a boost is created for the team
              //the team in the map is also updated
              singleChange = powChange * 0.1;
              var newBoost = {
                startPower: powChange,
                win: 0,
                sideSize: w2.length,
                showMod: showMod,
                titleMod: titleMod,
                date: show.date,
              };
              var newBoostString = JSON.stringify(newBoost);
              var found = false;
              for (let b of team.boosts) {
                var b2 = {
                  startPower: b.startPower,
                  win: b.win,
                  sideSize: b.sideSize,
                  showMod: b.showMod,
                  titleMod: b.titleMod,
                  date: b.date,
                };
                if (JSON.stringify(b2) == newBoostString) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                team.boosts.push(newBoost);
              }
              teamMap.set(teamKey, team);
            } else if (w2.length > 1) {
              //if it's a tag match but it isn't an established team, then it's 50%
              singleChange = powChange * 0.5;
            }

            //boosts for losers get calculated down HERE, because more has to be done to determine the powchange. the pre-boost powercalc happens further up
            var newBoost = {
              startPower: singleChange,
              win: 0,
              sideSize: w2.length,
              showMod: showMod,
              titleMod: titleMod,
              date: show.date,
            };
            wres.boosts.push(newBoost);
            if (wres.power === Number.NEGATIVE_INFINITY) {
              console.log('---BROKE HERE---');
              console.log(`${show.name} ---- ${show.date}`);
              console.log(`${w.name}`);
              console.log('LOSER');
              throw new Error('IT BROKE DUDE');
            }
            // console.log(`${w.name} POWER = ${w.power}`);
            wresMap.set(wres.name, {
              name: wres.name,
              power: wres.power,
              startPower: wres.startPower,
              boosts: wres.boosts,
              id: wres.id,
            });
          }
        }
        // break;
      }
      // break;
    }

    //run thru wresmap, do a final calc for everyone's power
    for (let [key, value] of wresMap) {
      const wres = await Wrestler.findById(value.id);
      if (wres == null) {
        continue;
      }
      wres.boosts = value.boosts;
      var calcPower = calcWrestlerPower(value, latestDate);
      var power = calcStreak(value, calcPower.power.toFixed(0)).toFixed(0);
      // if the most recent match is a loss, it needs a BIG ACROSS THE BOARD NERF.
      wres.power = power;

      wres.startPower = value.startPower;
      if (calcPower.timeGap >= 84) {
        wres.active = false;
      } else if (calcPower.timeGap <= 7) {
        wres.active = true;
      }
      if (value.name == 'Orange Cassidy') {
        console.log(`Orange Cassidy | ${wres.power}`);
      }
      if (wres.power === null) {
        console.log('---BROKE HERE---');
        console.log(`${key}`);
        throw err;
      }
      await Wrestler.findByIdAndUpdate(value.id, wres);
    }

    for (let [key, value] of teamMap) {
      const team = await Team.findById(value.id);
      if (team == null) {
        continue;
      }
      team.boosts = value.boosts;
      var calcPower = calcWrestlerPower(value, latestDate);
      var power = calcStreak(value, calcPower.power.toFixed(0)).toFixed(0);
      team.power = power;
      team.startPower = value.startPower;
      team.male = value.male;
      if (calcPower.timeGap >= 84) {
        team.active = false;
      } else if (calcPower.timeGap <= 7) {
        wres.active = true;
      }
      if (value.name == 'FTR') {
        console.log(`FTR | ${team.power}`);
      }
      if (team.power === null) {
        console.log('---BROKE HERE---');
        console.log(`${key}`);
        throw err;
      }
      await Team.findByIdAndUpdate(value.id, team);
    }

    console.log('---FINISHED---');
    res.status(201).json({
      //status 201 means Created
      status: 'success',
      message: 'Check the DB to see how successful it was!',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
