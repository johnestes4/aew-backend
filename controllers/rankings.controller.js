const Match = require('../models/match');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Title = require('../models/title');
const showController = require('./show.controller');
const APIFeatures = require('../utils/apiFeatures');
const Team = require('../models/team');

exports.getRankings = async (req, res) => {
  try {
    const featuresM = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'true' },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields(
        'name,power,profileImage,boosts,powerHistory,record,recordYear'
      );
    const featuresF = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'false' },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields(
        'name,power,profileImage,boosts,powerHistory,record,recordYear'
      );
    const features2 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 2 },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,boosts,powerHistory,record,recordYear');
    const features3 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 3 },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power');
    const featuresT = new APIFeatures(
      Title.find({
        promotion: { $eq: 'AEW' },
        name: { $not: /Interim/i },
      })
        .populate({
          path: 'currentChampion',
          model: Wrestler,
        })
        .populate({
          path: 'currentChampionTeam',
          model: Team,
        }),
      req.query
    ).limitFields('name,currentChampion,boosts,powerHistory,record,recordYear');

    const featuresD = new APIFeatures(
      Show.find().populate({
        path: 'matches',
        model: Match,
      }),
      req.query
    )
      .filter()
      .sort('-date')
      .paginate();

    var titles = await featuresT.query;
    const male = await featuresM.query;
    const female = await featuresF.query;
    const teams = await features2.query;
    const trios = await features3.query;
    var date = await featuresD.query;

    res.status(200).json({
      status: 'success',
      data: {
        male: male.slice(0, 20),
        female: female.slice(0, 20),
        tag: teams.slice(0, 20),
        trios: trios.slice(0, 20),
        titles: titles,
        date: date[0].date,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

savePowerHistory = async (arr, titles, team) => {
  var champIDs = new Map();
  for (let t of titles) {
    if (t.name.includes('AEW')) {
      if (t.currentChampionTeam) {
        champIDs.set(t.currentChampionTeam._id.toString());
      } else {
        for (c of t.currentChampion) {
          champIDs.set(c._id.toString());
        }
      }
    }
  }

  var count = 1;
  for (let wres of arr) {
    if (!wres || wres.boosts === undefined || wres.boosts.length == 0) {
      continue;
    }
    if (!wres.powerHistory) {
      wres.powerHistory = [];
    }

    wres.powerHistory.sort((a, b) => a.date.getTime() - b.date.getTime());

    // //it's been cranking out doubles of every power history cause i missed an extra push
    // // this should clean out all the duplicates. probably. i hope
    // // commenting this out now that it's been used. gonna keep it for the moment just in case i need it again
    // var phI = 0;
    // var phD = 'X';
    // var log = false;
    // if (wres.name == 'Jon Moxley') {
    //   log = true;
    // }
    // while (phI < wres.powerHistory.length) {
    //   if (log) {
    //     console.log(`${wres.name} | STARTING NEW LOOP | PHI: ${phI}`);
    //   }
    //   if (phI == wres.powerHistory.length - 1) {
    //     if (log) {
    //       console.log(
    //         `${wres.name} | PH LENGTH: ${wres.powerHistory.length} | PHI: ${phI}`
    //       );
    //     }
    //   }
    //   if (wres.powerHistory[phI].toString() == phD) {
    //     if (log) {
    //       console.log(`${wres.name} | SPLICING ${phI}`);
    //     }
    //     wres.powerHistory.splice(phI, 1);
    //     continue;
    //   } else {
    //     phI++;
    //     phD = wres.powerHistory[phI];
    //     continue;
    //   }
    // }
    var lastDate = wres.boosts[wres.boosts.length - 1].info.date;
    while (wres.powerHistory.length > 20) {
      wres.powerHistory.shift();
    }

    var newHistory = {
      date: lastDate,
      power: wres.power,
    };

    if (champIDs.has(wres._id.toString())) {
      newHistory.place = -1;
    } else {
      newHistory.place = count;
      count++;
    }
    // console.log(`${wres.name} | ${newHistory.place}`);
    if (wres.powerHistory.length > 0) {
      if (
        lastDate.toString() ==
        wres.powerHistory[wres.powerHistory.length - 1].date.toString()
      ) {
        wres.powerHistory[wres.powerHistory.length - 1] = newHistory;
      } else {
        wres.powerHistory.push(newHistory);
      }
    } else {
      wres.powerHistory.push(newHistory);
    }

    if (team) {
      wres = await Team.findByIdAndUpdate(wres._id, wres);
    } else {
      wres = await Wrestler.findByIdAndUpdate(wres._id, wres);
    }
  }
};

calcPowerHistory = async (req, res) => {
  try {
    const featuresM = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'true' },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,profileImage,boosts,powerHistory');
    const featuresF = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'false' },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,profileImage,boosts,powerHistory');
    const features2 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 2 },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,boosts,powerHistory');
    const features3 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 3 },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power');
    const featuresT = new APIFeatures(
      Title.find({
        promotion: { $eq: 'AEW' },
        name: { $not: /Interim/i },
      })
        .populate({
          path: 'currentChampion',
          model: Wrestler,
        })
        .populate({
          path: 'currentChampionTeam',
          model: Team,
        }),
      req.query
    ).limitFields('name,currentChampion,boosts,powerHistory');

    const featuresD = new APIFeatures(
      Show.find().populate({
        path: 'matches',
        model: Match,
      }),
      req.query
    )
      .filter()
      .sort('-date')
      .paginate();

    var titles = await featuresT.query;

    const male = await featuresM.query;

    const female = await featuresF.query;

    const teams = await features2.query;

    const trios = await features3.query;

    var date = await featuresD.query;

    console.log('calcing male history...');
    await savePowerHistory(male, titles, false);
    console.log('calcing female history...');
    await savePowerHistory(female, titles, false);
    console.log('calcing tag history...');
    await savePowerHistory(teams, titles, true);
    console.log('calcing trio history...');
    await savePowerHistory(trios, titles, true);
  } catch (err) {
    console.log(err);
    return err;
  }
};

function calcShowMod(show, match, win) {
  var showMod = 1;
  if (
    show.name.includes('Dark') ||
    show.name.includes('Elevation') ||
    show.name.includes('Tournament')
  ) {
    // startingPower = 100;
    showMod = 0.5;
  } else if (
    win &&
    (match.matchType.toLowerCase().includes('dark') || match.preshow)
  ) {
    showMod = 0.25;
  } else if (
    (!win && match.matchType.toLowerCase().includes('dark')) ||
    match.preshow
  ) {
    showMod = 2.5;
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

function checkBoost(boost, wres) {
  var found = false;
  for (let b of wres.boosts) {
    if (boost.match.toString() == b.match.toString()) {
      found = true;
      break;
    }
  }
  if (!found) {
    wres.boosts.push(boost);
  }
  return wres.boosts;
}

function calcWrestlerPower(wrestler, currentDate) {
  //IDEA: modifier based on how long boosts is, ie how many matches a person/team has had
  //weight more heavily towards people with more matches?
  //at least teams, i guess - skew a bit towards long-running teams?
  //maybe not. i think orange/trent is an outlier

  var team = wrestler.wrestlers !== undefined;
  var currentPower = 0 + wrestler.startPower;
  //this now returns an OBJECT so that it can also return the gap of time since the last match. this will be used to inactive people after 12 weeks (84 days)
  var timeGap = 999;
  var singlesGap = 999;
  var currentYear = currentDate.getYear();
  wrestler.boosts.sort((a, b) => a.info.date.getTime() - b.info.date.getTime());
  var record = {
    overallWins: 0,
    overallLosses: 0,
    overallDraws: 0,
    singlesWins: 0,
    singlesLosses: 0,
    singlesDraws: 0,
    tagWins: 0,
    tagLosses: 0,
    tagDraws: 0,
    trioWins: 0,
    trioLosses: 0,
    trioDraws: 0,
  };
  var recordYear = {
    overallWins: 0,
    overallLosses: 0,
    overallDraws: 0,
    singlesWins: 0,
    singlesLosses: 0,
    singlesDraws: 0,
    tagWins: 0,
    tagLosses: 0,
    tagDraws: 0,
    trioWins: 0,
    trioLosses: 0,
    trioDraws: 0,
  };

  for (let boost of wrestler.boosts) {
    var modifier = 1;
    var ppvModifier = 1;
    var teamModifier = 1;
    var winModifier = 1;

    if (boost.win == 1) {
      if (boost.sideSize == 1) {
        record.singlesWins++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.singlesWins++;
        }
      } else if (boost.sideSize == 2) {
        record.tagWins++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.tagWins++;
        }
      } else if (boost.sideSize == 3) {
        record.trioWins++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.trioWins++;
        }
      }
      record.overallWins++;
      if (currentYear == boost.info.date.getYear()) {
        recordYear.overallWins++;
      }
    } else if (boost.win == 0) {
      if (boost.sideSize == 1) {
        record.singlesLosses++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.singlesLosses++;
        }
      } else if (boost.sideSize == 2) {
        record.tagLosses++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.tagLosses++;
        }
      } else if (boost.sideSize == 3) {
        record.trioLosses++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.trioLosses++;
        }
      }
      record.overallLosses++;
      if (currentYear == boost.info.date.getYear()) {
        recordYear.overallLosses++;
      }
    } else if (boost.win == 0.5) {
      if (boost.sideSize == 1) {
        record.singlesDraws++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.singlesDraws++;
        }
      } else if (boost.sideSize == 2) {
        record.tagDraws++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.tagDraws++;
        }
      } else if (boost.sideSize == 3) {
        record.trioDraws++;
        if (currentYear == boost.info.date.getYear()) {
          recordYear.trioDraws++;
        }
      }
      record.overallDraws++;
      if (currentYear == boost.info.date.getYear()) {
        recordYear.overallDraws++;
      }
    }

    var daysSince = Math.round(
      (currentDate.getTime() - boost.info.date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if ((!team && boost.sideSize == 1) || (team && boost.sideSize == 2)) {
      if (daysSince < singlesGap) {
        singlesGap = 0 + daysSince;
      }
    }
    if (boost.showMod !== 0.25 && boost.showMod !== 2.5) {
      timeGap = 0 + daysSince;
    }

    if (daysSince >= 365) {
      modifier = 0.01;
      ppvModifier = 1.1;
    } else if (daysSince >= 140) {
      modifier = 0.01;
      ppvModifier = 1.1;
    } else if (daysSince >= 112) {
      modifier = 0.05;
      ppvModifier = 1.1;
    } else if (daysSince >= 84) {
      modifier = 0.1;
      ppvModifier = 1.1;
    } else if (daysSince >= 56) {
      modifier = 0.2;
      ppvModifier = 1.1;
    } else if (daysSince >= 28) {
      modifier = 0.33;
      ppvModifier = 1.1;
    } else if (daysSince >= 14) {
      modifier = 0.67;
      ppvModifier = 1.1;
    } else if (daysSince >= 7) {
      modifier = 0.85;
      ppvModifier = 1.15;
      winModifier = 1.1;
      // teamModifier = 0.9;
    } else {
      modifier = 1;
      ppvModifier = 1.25;
      winModifier = 1.15;
      // teamModifier = 0.75;
    }
    var finalBoost = boost.startPower * boost.showMod;
    if (
      finalBoost === null ||
      finalBoost === NaN ||
      finalBoost === Number.NEGATIVE_INFINITY
    ) {
      console.log('UP HIGH');
      console.log(
        'POWER BROKE: ' +
          currentPower +
          ' | ' +
          wrestler.name +
          ' | ' +
          wrestler.power +
          ' | ' +
          currentDate
      );
      console.log(boost);
      console.log(`==${finalBoost} || ${modifier}==`);
      throw new Error('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
    }
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
      console.log(
        'POWER BROKE: ' +
          currentPower +
          ' | ' +
          wrestler.name +
          ' | ' +
          wrestler.power +
          ' | ' +
          currentDate
      );
      console.log(wrestler.boosts[wrestler.boosts.length - 1]);
      console.log(`==${finalBoost} || ${modifier}==`);
      throw new Error('POWER BROKE: ' + wrestler.name + ' | ' + currentDate);
    }
  }
  calcReturn = {
    power: currentPower,
    timeGap: timeGap,
    singlesGap: singlesGap,
    record: record,
    recordYear: recordYear,
  };
  return calcReturn;
}

function calcStreak(wres, power, currentDate) {
  var debugName = '';
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
  var weeksSince = 999;

  var whichTitleBuffs = 0;

  //it should go backwards thru the last 15 matches to find the last 5 matches of the proper size and the last 5 title matches
  for (
    let i = wres.boosts.length - 1;
    i > wres.boosts.length - 21 && i >= 0;
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
        `${debugName} | I: ${i}/${wres.boosts.length - 1} | DATE: ${boost.info.date}`
      );
    }

    if (wresSize == boost.sideSize || (wresSize == 2 && boost.sideSize == 3)) {
      if (boost.showMod == 0.25 || boost.showMod == 2.5) {
        continue;
      }
      var newGap = Math.round(
        (currentDate.getTime() - boost.info.date.getTime()) /
          (1000 * 60 * 60 * 24) /
          7
      );
      if (newGap < weeksSince) {
        weeksSince = newGap;
      }

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
          `${debugName} | ${streak} | I: ${i}/${wres.boosts.length - 1} | LR: ${lastResult} | WIN: ${boost.win} | DATE: ${boost.info.date} | TITLE: ${boost.titleMod} | STARTPOWER: ${boost.startPower}`
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
    [0.025, 0.05, 0.1, 0.12, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
  ];
  //arr 1: buffs for no title streak - ie all 1. arr 2: secondary titles. arr 3: world titles
  var titleBuffs = [
    [0, 0, 0, 0, 0, 0],
    [0, 0.05, 0.07, 0.1, 0.14, 0.18],
    [0, 0.1, 0.12, 0.14, 0.17, 0.2],
  ];
  var buffWeeksDecay = [1, 1, 0.9, 0.8, 0.67, 0.5, 0.33, 0.2, 0.05, 0];
  if (weeksSince > buffWeeksDecay.length - 1) {
    weeksSince = buffWeeksDecay.length - 1;
  }

  var titleStreak = 0;
  if (worldStreak > 0) {
    titleStreak = worldStreak;
  } else if (secondaryStreak > 0) {
    titleStreak = secondaryStreak;
  }

  //LSM is StartingPower / Current Power. this should make it so the closer you are to baseline, the stronger a losing streak debuff is
  // var losingStreakModifier = (wres.startPower * 0.8) / power;
  // if (lastResult == 0) {
  //   streakMod = streakMod * losingStreakModifier;
  // }

  //if it gets here without any sort of streak, just gotta ensure it doesn't have a negative number and that lastresult isn't null
  var streakMod = 0;
  if (lastResult !== null) {
    streakMod = buffs[lastResult][streak - 1];
  }
  var titleMod = titleBuffs[whichTitleBuffs][titleStreak];
  if (lastTitleResult == 0) {
    titleMod = titleMod * -1;
  }
  if ((lastResult = 1)) {
    streakMod = streakMod * buffWeeksDecay[weeksSince];
  }
  power = power * (1 + streakMod) * (1 + titleMod);

  return power;
}

function findInnerTeams(ids, teamMap, idPower, masterKey, date) {
  var inTeam = new Map();
  var idPower = new Map();
  for (let id1 of ids) {
    for (let id2 of ids) {
      if (id2 == id1) {
        continue;
      }
      var newKey = JSON.stringify([id1, id2].sort());
      if (newKey == masterKey) {
        continue;
      }
      if (teamMap.has(newKey)) {
        var team = teamMap.get(newKey);
        // check if either id is already in the inTeam map. if it is, check if this new team's boost length is higher
        // if it is, replace the id already there. if it's not, continue
        // this should cause it to always use the teams with the most matches
        if (!inTeam.has(id1) && !inTeam.has(id2)) {
          inTeam.set(id1, team);
          inTeam.set(id2, team);
        } else if (inTeam.has(id1)) {
          if (inTeam.get(id1).boosts.length > team.boosts.length) {
            continue;
          }
        } else if (inTeam.has(id2)) {
          if (inTeam.get(id2).boosts.length > team.boosts.length) {
            continue;
          }
        }
        inTeam.delete(id1);
        inTeam.delete(id2);
        var calcReturn = calcWrestlerPower(team, date).power;
        team.power = calcReturn.power;
        team.record = calcReturn.record;
        team.recordYear = calcReturn.recordYear;
        inTeam.set(id1, team);
        inTeam.set(id2, team);
        teamMap.set(newKey, team);
      }
    }
  }
  return {
    inTeam: inTeam,
    idPower: idPower,
    teamMap: teamMap,
  };
}

exports.calcRankings = async (req, res) => {
  try {
    // throw Error('STOPPING');
    const shows = await Show.find();
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
        const kFactor = startingPower * 0.1;
        //x-factor affects the change brought on by the difference between winner and loser
        // a higher number seems to lead to bigger changes, but not by a ton

        const xFactor = startingPower * 0.2;

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

        var winnerSide = {
          teamKey: null,
          innerTeamKeys: [],
          names: [],
          powers: [],
          avgPower: 0,
        };
        var winnerIDs = [];
        var idPower = new Map();
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
              newWres.power = 1000;
              newWres.startPower = 1000;
            }
            wresMap.set(w.name, newWres);
          }
          winnerSide.names.push(w.name);
          var wres = wresMap.get(w.name);
          if (wres.boosts.length > 0) {
            //if the wrestler has any boosts, then calculate their most recent power - BEFORE adding it to the average used to rate the newest boost
            var calcReturn = calcWrestlerPower(wres, show.date).power;
            wres.power = calcReturn.power;
            wres.record = calcReturn.record;
            wres.recordYear = calcReturn.recordYear;
          }
          winnerSide.powers.push(wres.power);
          idPower.set(w._id, wres.power);
          wresMap.set(w.name, wres);
        }
        var powerSum = winnerSide.powers.reduce((a, b) => a + b, 0);
        winnerSide.avgPower = powerSum / winnerSide.powers.length;
        var winnerKey = JSON.stringify(winnerIDs.sort());
        //this should change what it's calcing with if a team exists
        if (teamMap.has(winnerKey)) {
          var team = teamMap.get(winnerKey);
          team.male = match.winner[0].male;
          teamMap.set(winnerKey, team);
          if (team.startPower == null || team.startPower === undefined) {
            team.startPower = startingPower;
          }
          var calcReturn = calcWrestlerPower(team, show.date).power;
          team.power = calcReturn.power;
          team.record = calcReturn.record;
          team.recordYear = calcReturn.recordYear;
          teamMap.set(winnerKey, team);
          winnerSide.teamKey = winnerKey;
          winnerSide.avgPower = team.power;
        }
        if (match.winner.length > 2) {
          // this SHOULD, if it's a multi-man tag with a tag team contained, find all contained tag teams and recalc the poweravg to use the teams' power instead
          var totalTeamPower = 0;
          var totalTeamCount = 0;

          var innerTeamResults = findInnerTeams(
            winnerIDs,
            teamMap,
            idPower,
            winnerKey,
            show.date
          );

          var inTeam = innerTeamResults.inTeam;
          teamMap = innerTeamResults.teamMap;
          idPower = innerTeamResults.idPower;

          // go through the idpower map, skip everyone thats also in the inteam map, add their power to totalpower and increase totalteamcount
          // side note: there's definitely a specific word for increasing a value by 1 but i can't remember it
          for (let [key, value] of idPower) {
            if (!inTeam.has(key)) {
              totalTeamPower += value;
              totalTeamCount++;
            }
          }
          //use alreadyUsed to keep track of which teams have already had their power added, since each team has two records in the map
          var alreadyUsed = new Map();
          for (let [key, value] of inTeam) {
            if (!alreadyUsed.has(value.name)) {
              alreadyUsed.set(value.name);
              winnerSide.innerTeamKeys.push(
                JSON.stringify(value.wrestlers.sort())
              );
              totalTeamPower += value.power;
              totalTeamCount++;
            }
          }
          // this should create a properly averaged power of all the singles wrestlers and all the tag teams
          winnerSide.avgPower = totalTeamPower / totalTeamCount;
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
            innerTeamKeys: [],
            names: [],
            powers: [],
            avgPower: 0,
          };
          var loserIDs = [];
          var idPower = new Map();
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
              var calcReturn = calcWrestlerPower(wres, show.date).power;
              wres.power = calcReturn.power;
              wres.record = calcReturn.record;
              wres.recordYear = calcReturn.recordYear;
            }
            idPower.set(w._id, wres.power);
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
            var calcReturn = calcWrestlerPower(team, show.date).power;
            team.power = calcReturn.power;
            team.record = calcReturn.record;
            team.recordYear = calcReturn.recordYear;
            teamMap.set(loserKey, team);
            newLoser.teamKey = loserKey;
            newLoser.avgPower = team.power;
          }
          if (w2.length > 2) {
            var totalTeamPower = 0;
            var totalTeamCount = 0;
            var innerTeamResults = findInnerTeams(
              loserIDs,
              teamMap,
              idPower,
              loserKey,
              show.date
            );

            var inTeam = innerTeamResults.inTeam;
            teamMap = innerTeamResults.teamMap;
            idPower = innerTeamResults.idPower;

            var alreadyUsed = new Map();
            for (let [key, value] of inTeam) {
              if (!alreadyUsed.has(value.name)) {
                alreadyUsed.set(value.name);
                newLoser.innerTeamKeys.push(
                  JSON.stringify(value.wrestlers.sort())
                );
                totalTeamPower += value.power;
                totalTeamCount++;
              }
            }
            newLoser.avgPower = totalTeamPower / totalTeamCount;
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
          const wres = wresMap.get(w.name);
          var expWin =
            1 /
            (1 +
              (10 ^ ((loserSum / loserSides.length - wres.power) / xFactor)));

          var showMod = calcShowMod(show, match, true);
          if (expWin === Number.POSITIVE_INFINITY) {
            console.log('CORRECTING INFINITY');
            expWin = 1.000000000001;
          }
          var winMod = 1;
          if (match.result.includes('Draw')) {
            winMod = 0.5;
          }
          var powChange = titleMod * kFactor * (winMod - expWin) * showMod;
          if (powChange === Number.NEGATIVE_INFINITY) {
            console.log(
              `EXPWIN: ${expWin} | LOSERSUM: ${loserSum} | LOSERSIDES: ${loserSides.length} | WRESPOWER: ${wres.power}`
            );
            throw Error('NEGATIVE INFINITY ERROR');
          }

          if (wres.boosts === undefined) {
            wres.boosts = [];
          }
          var singleChange = 0 + powChange;
          var team = null;
          if (winnerSide.teamKey) {
            team = teamMap.get(winnerSide.teamKey);
          }
          if (team) {
            //if there's a matching team, then the single power is cut and a boost is created for the team
            //the team in the map is also updated
            singleChange = powChange * 0.1;
            //FIRST THINGS FIRST. we need to check if this boost already exists, so it doesn't get added for every member of the team
            var newBoost = {
              info: {
                string: '',
                result: match.result,
                time: match.time,
                date: show.date,
              },
              startPower: powChange,
              win: winMod,
              sideSize: match.winner.length,
              showMod: showMod,
              titleMod: titleMod,
              match: match._id,
            };
            team.boosts = checkBoost(newBoost, team);
            teamMap.set(winnerSide.teamKey, team);
          } else if (match.winner.length > 1) {
            //if it's a tag match but it isn't an established team, then it's 50%
            singleChange = powChange * 0.5;
          }
          newBoost = {
            info: {
              string: '',
              result: match.result,
              time: match.time,
              date: show.date,
            },
            startPower: singleChange,
            win: winMod,
            sideSize: match.winner.length,
            showMod: showMod,
            titleMod: titleMod,
            match: match._id,
          };
          wres.boosts.push(newBoost);
          wresMap.set(wres.name, {
            name: wres.name,
            power: wres.power,
            startPower: wres.startPower,
            boosts: wres.boosts,
            id: wres.id,
          });
          if (winnerSide.innerTeamKeys.length > 0) {
            // if the team is an existing trio, it'll cut the value granted to the inner team
            // this should prevent inner team power from growing out of control
            if (team) {
              newBoost.startPower = newBoost.startPower * 0.2;
            } else {
              newBoost.startPower = newBoost.startPower * 0.5;
            }

            for (let innerKey of winnerSide.innerTeamKeys) {
              var innerTeam = teamMap.get(innerKey);
              // var newBoostString = JSON.stringify(newBoost);
              var found = false;
              for (let b of innerTeam.boosts) {
                if (newBoost.match.toString() == b.match.toString()) {
                  found = true;
                  break;
                }
              }
              if (!found) {
                innerTeam.boosts.push(newBoost);
                teamMap.set(innerKey, innerTeam);
              }
            }
          }
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

            // okay, make this master array of all the inner teams. this should allow me to boost all of them
            //
            var innerTeamKeys = [];

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
                innerTeamKeys = loser.innerTeamKeys;
                break;
              }
              opponentPowers.push(loser.avgPower);
              opponentCount++;
            }
            var powerSum = opponentPowers.reduce((a, b) => a + b, 0);
            const wres = wresMap.get(w.name);
            var expWin =
              1 /
              (1 + (10 ^ ((powerSum / opponentCount - wres.power) / xFactor)));
            if (expWin === Number.POSITIVE_INFINITY) {
              console.log('CORRECTING INFINITY');
              expWin = 1.000000000001;
            }

            var showMod = calcShowMod(show, match, false);
            var winMod = 0;
            if (match.result.includes('Draw')) {
              winMod = 0.5;
            }

            var powChange = titleMod * kFactor * (winMod - expWin) * showMod;

            if (wres.boosts === undefined) {
              wres.boosts = [];
            }

            var singleChange = 0 + powChange;
            if (team) {
              //if there's a matching team, then the single power is cut to a tenth and a boost is created for the team
              //the team in the map is also updated
              singleChange = powChange * 0.1;
              var newBoost = {
                info: {
                  string: '',
                  result: match.result,
                  time: match.time,
                  date: show.date,
                },
                startPower: powChange,
                win: winMod,
                sideSize: w2.length,
                showMod: showMod,
                titleMod: titleMod,
                match: match._id,
              };
              team.boosts = checkBoost(newBoost, team);
              teamMap.set(teamKey, team);
            } else if (w2.length > 1) {
              //if it's a tag match but it isn't an established team, then it's 50%
              singleChange = powChange * 0.5;
            }

            //boosts for losers get calculated down HERE, because more has to be done to determine the powchange. the pre-boost powercalc happens further up
            var newBoost = {
              info: {
                string: '',
                result: match.result,
                time: match.time,
                date: show.date,
              },
              startPower: singleChange,
              win: winMod,
              sideSize: w2.length,
              showMod: showMod,
              titleMod: titleMod,
              match: match._id,
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

            // INNER TEAM CALC
            // has to go down here so it can work off the same boost as the inner singles calc
            if (w2.length > 2 && innerTeamKeys.length > 0) {
              if (team) {
                newBoost.startPower = newBoost.startPower * 0.2;
              } else {
                newBoost.startPower = newBoost.startPower * 0.5;
              }
              // check against existing boosts, if boost isn't already there we add it.
              // duplicate boosts should still be avoided
              for (let innerKey of innerTeamKeys) {
                var innerTeam = teamMap.get(innerKey);
                // var newBoostString = JSON.stringify(newBoost);
                var found = false;
                for (let b of innerTeam.boosts) {
                  if (newBoost.match.toString() == b.match.toString()) {
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  innerTeam.boosts.push(newBoost);
                  teamMap.set(innerKey, innerTeam);
                }
              }
            }
          }
        }
        // break;
      }
      // break;
    }

    //run thru wresmap, do a final calc for everyone's power
    console.log('Final wrestler calculations...');
    for (let [key, value] of wresMap) {
      const wres = await Wrestler.findById(value.id);
      if (wres == null) {
        continue;
      }
      value.boosts.sort(
        (a, b) => a.info.date.getTime() - b.info.date.getTime()
      );
      wres.boosts = value.boosts;

      var calcPower = calcWrestlerPower(value, latestDate);
      var power = calcStreak(
        value,
        calcPower.power.toFixed(0),
        latestDate
      ).toFixed(0);
      // if the most recent match is a loss, it needs a BIG ACROSS THE BOARD NERF.
      wres.power = power;
      wres.record = calcPower.record;
      wres.recordYear = calcPower.recordYear;

      wres.startPower = value.startPower;
      // if (wres.name == 'Samoa Joe' || wres.name == 'Chris Jericho') {
      //   console.log(
      //     `${wres.name} | TIMEGAP:${calcPower.timeGap} | SINGLESGAP:${calcPower.singlesGap} | LATESTDATE:${latestDate}`
      //   );
      // }
      if (calcPower.singlesGap >= 28 || wres.name == 'Adam Copeland') {
        wres.active = false;
      } else if (calcPower.singlesGap <= 7) {
        wres.active = true;
      }
      if (wres.power === null) {
        console.log('---BROKE HERE---');
        console.log(`${key}`);
        throw err;
      }
      await Wrestler.findByIdAndUpdate(value.id, wres);
    }

    console.log('Final team calculations...');
    for (let [key, value] of teamMap) {
      const team = await Team.findById(value.id);
      if (team == null) {
        continue;
      }
      value.boosts.sort(
        (a, b) => a.info.date.getTime() - b.info.date.getTime()
      );
      team.boosts = value.boosts;

      var calcPower = calcWrestlerPower(value, latestDate);
      var power = calcStreak(
        value,
        calcPower.power.toFixed(0),
        latestDate
      ).toFixed(0);
      team.power = power;
      team.record = calcPower.record;
      team.recordYear = calcPower.recordYear;
      team.startPower = value.startPower;
      team.male = value.male;
      // if (
      //   team.name == 'FTR' ||
      //   team.name == 'The Gunns' ||
      //   team.name == 'The Acclaimed' ||
      //   team.name == 'Matt Sydal & Dante Martin'
      // ) {
      //   console.log(
      //     `${team.name} | TIMEGAP:${calcPower.timeGap} | LATESTDATE:${latestDate}`
      //   );
      // }
      if (calcPower.singlesGap >= 56) {
        team.active = false;
      } else if (calcPower.singlesGap <= 56) {
        team.active = true;
      }
      if (team.power === null) {
        console.log('---BROKE HERE---');
        console.log(`${key}`);
        throw err;
      }
      await Team.findByIdAndUpdate(value.id, team);
    }

    await calcPowerHistory(req, res);

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
