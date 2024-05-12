const Match = require('../models/match');
const Wrestler = require('./../models/wrestler');
const Show = require('./../models/show');
const showController = require('../controllers/showController');
const APIFeatures = require('../utils/apiFeatures');

powerCalc = async (matchId, wresMap) => {
  try {
    return wresMap;
  } catch (err) {
    console.log(err);
    return err;
  }
};

function calcWrestlerPower(wrestler, currentDate) {
  var currentPower = 0 + wrestler.startPower;
  var winStreak = 0;
  var loseStreak = 0;
  for (let boost of wrestler.boosts) {
    var modifier = 1;
    var daysSince = Math.round(
      (currentDate.getTime() - boost.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince >= 365) {
      boost.ppv ? (modifier = 0.05) : (modifier = 0.01);
    } else if (daysSince >= 140) {
      boost.ppv ? (modifier = 0.1) : (modifier = 0.05);
    } else if (daysSince >= 112) {
      boost.ppv ? (modifier = 0.15) : (modifier = 0.1);
    } else if (daysSince >= 84) {
      boost.ppv ? (modifier = 0.2) : (modifier = 0.15);
    } else if (daysSince >= 56) {
      boost.ppv ? (modifier = 0.33) : (modifier = 0.25);
    } else if (daysSince >= 28) {
      boost.ppv ? (modifier = 0.6) : (modifier = 0.5);
    } else if (daysSince >= 14) {
      modifier = 0.75;
    } else if (daysSince >= 7) {
      modifier = 0.9;
    }
    currentPower += boost.startPower * modifier;
    if (
      currentPower === null ||
      currentPower === NaN ||
      currentPower === Number.NEGATIVE_INFINITY
    ) {
      console.log('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
      console.log(wrestler.boosts);
      throw new Error('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
    }
  }
  return currentPower;
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
    for (let show of shows) {
      var startingPower = 500;
      latestDate = show.date;
      showCount++;
      // if (showCount > 50) {
      //   break;
      // }
      console.log(`Beginning show ${showCount}...`);
      var showMod = 1;
      if (
        show.name.includes('Dark') ||
        show.name.includes('Elevation') ||
        show.name.includes('Tournament')
      ) {
        // startingPower = 100;
        showMod = 1.5;
      } else if (show.ppv) {
        showMod = 0.5;
      }
      for (let mId of show.matches) {
        const match = await Match.findById(mId).populate({
          path: 'winner loser',
          model: Wrestler,
        });
        var totalSides = 0;
        const xFactor = 50;
        const kFactor = 200;
        var matchWeight = 1;
        if (match.title.length > 0) {
          matchWeight = 1.5;
          if (
            match.title[0] == '660f3be7b82fe2310454972d' || //world title
            match.title[0] == '660f3be7b82fe23104549747' //women's world title
          ) {
            matchWeight = 2;
          }
        }

        /*
          it needs to average every SIDE in a match, then be able to average all the SIDES except the one it's currently calculating
          in team situations, it can apply the same expchange to both teammates - calced based on their average together
        */
        var winnerSide = {
          names: [],
          powers: [],
          avgPower: 0,
        };
        for (let w of match.winner) {
          if (w === null) {
            continue;
          }
          if (!wresMap.has(w.name)) {
            wresMap.set(w.name, {
              name: w.name,
              power: startingPower,
              startPower: startingPower,
              boosts: [],
              id: w._id,
            });
          }
          totalSides++;
          winnerSide.names.push(w.name);
          winnerSide.powers.push(wresMap.get(w.name).power);
          var powerSum = winnerSide.powers.reduce((a, b) => a + b, 0);
          winnerSide.avgPower = powerSum / winnerSide.powers.length;
        }
        var loserSides = [];
        for (let w2 of match.loser) {
          var newLoser = {
            names: [],
            powers: [],
            avgPower: 0,
          };
          for (let w of w2) {
            if (w === null) {
              continue;
            }
            if (!wresMap.has(w.name)) {
              wresMap.set(w.name, {
                name: w.name,
                power: startingPower,
                startPower: startingPower,
                boosts: [],
                id: w._id,
              });
            }
            totalSides++;
            newLoser.names.push(w.name);
            newLoser.powers.push(wresMap.get(w.name).power);
          }
          var powerSum = newLoser.powers.reduce((a, b) => a + b, 0);
          newLoser.avgPower = powerSum / newLoser.powers.length;
          loserSides.push(newLoser);
        }
        // return null;

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
            (1 / (1 + (10 ^ (loserSum / loserSides.length / xFactor)))) *
            showMod;
          const wres = wresMap.get(w.name);
          var powChange = matchWeight * kFactor * (1 - expWin);
          if (wres.boosts === undefined) {
            wres.boosts = [];
          }
          wres.boosts.push({
            startPower: powChange,
            ppv: show.ppv,
            date: show.date,
          });
          wres.power = calcWrestlerPower(wres, show.date);
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
            for (let loser of loserSides) {
              for (let name of loser.names) {
                if (name == w.name) {
                  isCurrentSide = true;
                  break;
                }
              }
              if (isCurrentSide) {
                break;
              }
              opponentPowers.push(loser.avgPower);
              opponentCount++;
            }
            var powerSum = opponentPowers.reduce((a, b) => a + b, 0);
            var loserShowMod = showMod;
            // if ((showMod = 1.5)) {
            //   loserShowMod = 0.75;
            // }
            // if ((showMod = 0.5)) {
            //   loserShowMod = 0.25;
            // }
            var expWin =
              (1 / (1 + (10 ^ (powerSum / opponentCount / xFactor)))) *
              loserShowMod;
            const wres = wresMap.get(w.name);
            var powChange = matchWeight * kFactor * (0 - expWin);
            if (wres.boosts === undefined) {
              wres.boosts = [];
            }
            wres.boosts.push({
              startPower: powChange,
              ppv: show.ppv,
              date: show.date,
            });
            wres.power = calcWrestlerPower(wres, show.date);
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
              boosts: wres.boosts,
              id: wres.id,
            });
          }
        }
        // break;
      }
      // break;
    }

    //
    for (let [key, value] of wresMap) {
      const wres = await Wrestler.findById(value.id);
      wres.boosts = value.boosts;
      wres.power = calcWrestlerPower(wres, latestDate);
      wres.startPower = value.startPower;
      if (value.name == 'Adam Page') {
        console.log('Adam Page');
        console.log(wres.power);
      }
      if (wres.power === null) {
        console.log('---BROKE HERE---');
        console.log(`${key}`);
        throw err;
      }
      await Wrestler.findByIdAndUpdate(value.id, wres);
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
