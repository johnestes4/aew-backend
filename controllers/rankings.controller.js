const Match = require('../models/match');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Title = require('../models/title');
const showController = require('./show.controller');
const APIFeatures = require('../utils/apiFeatures');
const TitleReign = require('../models/titleReign');

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
        'name,power,profileImage,boosts,powerHistory,record,recordYear,streak,streakFact'
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
        'name,power,profileImage,boosts,powerHistory,record,recordYear,streak,streakFact'
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
      .limitFields(
        'name,power,boosts,powerHistory,record,recordYear,streak,streakFact'
      );
    const features3 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 3 },
        active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields(
        'name,power,boosts,powerHistory,record,recordYear,streak,streakFact'
      );
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
        })
        .populate({
          path: 'reigns',
          model: TitleReign,
        }),
      req.query
    ).limitFields('name,currentChampion,boosts,powerHistory,reigns');

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

savePowerHistory = async (arr, titles, latestDate, team) => {
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

    while (wres.powerHistory.length > 20) {
      wres.powerHistory.shift();
    }

    var newHistory = {
      date: latestDate,
      power: wres.power,
    };

    if (champIDs.has(wres._id.toString())) {
      newHistory.place = -1;
    } else if (wres.active) {
      newHistory.place = count;
      count++;
    } else {
      newHistory.place = 999;
    }
    // console.log(`${wres.name} | ${newHistory.place}`);
    if (wres.powerHistory.length > 0) {
      if (
        latestDate.toString() ==
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

calcPowerHistory = async (req, res, latestDate) => {
  try {
    const featuresM = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'true' },
        // active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,active,profileImage,boosts,powerHistory');
    const featuresF = new APIFeatures(
      Wrestler.find({
        male: { $eq: 'false' },
        // active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,active,profileImage,boosts,powerHistory');
    const features2 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 2 },
        // active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,active,boosts,powerHistory');
    const features3 = new APIFeatures(
      Team.find({
        male: { $eq: 'true' },
        wrestlers: { $size: 3 },
        // active: { $eq: 'true' },
      }),
      req.query
    )
      .sort('-power')
      .limitFields('name,power,active,boosts,powerHistory');
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
    ).limitFields('name,currentChampion,active,boosts,powerHistory');

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
    await savePowerHistory(male, titles, latestDate, false);
    console.log('calcing female history...');
    await savePowerHistory(female, titles, latestDate, false);
    console.log('calcing tag history...');
    await savePowerHistory(teams, titles, latestDate, true);
    console.log('calcing trio history...');
    await savePowerHistory(trios, titles, latestDate, true);
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
    (!win && match.preshow && !show.ppv)
  ) {
    showMod = 1.5;
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
  wrestler.boosts.sort((a, b) => a.info.date.getTime() - b.info.date.getTime());
  var currentPower = 0 + wrestler.startPower;
  var lastWinDate;
  if (wrestler.boosts.length > 0) {
    for (let i = wrestler.boosts.length - 1; i >= 0; i--) {
      if (wrestler.boosts[i].win == 1) {
        lastWinDate = wrestler.boosts[i].info.date;
        break;
      }
    }
  }
  var timeGap = 999;
  var singlesGap = 999;
  var currentYear = currentDate.getYear();
  var cashIn = false;
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
  if (wrestler.boosts.length == 0) {
    cashIn = true;
  } else if (
    // if last match is win AND last match is on most recent show, it's cashin time
    wrestler.boosts[wrestler.boosts.length - 1].win == 1
  ) {
    cashIn = true;
  }

  for (let boost of wrestler.boosts) {
    var modifier = 1;
    var ppvModifier = 1;
    var teamModifier = 1;
    var winModifier = 1;
    var lossModifier = 1;

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
    if (
      (!team && boost.sideSize == 1) ||
      (team && boost.sideSize == wrestler.wrestlers.length)
    ) {
      if (daysSince < singlesGap) {
        singlesGap = 0 + daysSince;
      }
    }
    if (boost.showMod !== 0.25 && boost.showMod !== 2.5) {
      timeGap = 0 + daysSince;
    }
    // IF IT'S A LOSS
    if (boost.win !== 1) {
      if (!cashIn) {
        currentPower += boost.currentPower;
        continue;
      }
      if (lastWinDate) {
        // if it's cashin time, we calc the decay - but we do it based on when that most recent win took place.
        // this way you don't get extra points if your last match was a win three weeks ago. decay ONLY HAPPENS on THE SAME SHOW
        if (boost.info.date.getTime() <= lastWinDate.getTime()) {
          daysSince = Math.round(
            (lastWinDate.getTime() - boost.info.date.getTime()) /
              (1000 * 60 * 60 * 24)
          );
        } else {
          console.log(`${wres.name} | ${boost.info.date} | ${lastWinDate}`);
        }
      }
    }

    if (daysSince >= 365) {
      modifier = 0.02;
      ppvModifier = 1.1;
    } else if (daysSince >= 140) {
      modifier = 0.05;
      ppvModifier = 1.1;
    } else if (daysSince >= 112) {
      modifier = 0.1;
      ppvModifier = 1.1;
    } else if (daysSince >= 84) {
      modifier = 0.25;
      ppvModifier = 1.1;
    } else if (daysSince >= 56) {
      modifier = 0.5;
      ppvModifier = 1.1;
    } else if (daysSince >= 28) {
      modifier = 0.67;
      ppvModifier = 1.1;
      winModifier = 1.025;
    } else if (daysSince >= 14) {
      modifier = 0.8;
      ppvModifier = 1.1;
      winModifier = 1.05;
    } else if (daysSince >= 7) {
      modifier = 0.9;
      ppvModifier = 1.15;
      lossModifier = 1.05;
      winModifier = 1.05;
      // teamModifier = 0.9;
    } else {
      modifier = 1;
      ppvModifier = 1.25;
      lossModifier = 1.1;
      winModifier = 1.1;
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
    boost.currentPower = finalBoost;
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
    boosts: wrestler.boosts,
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
  var divisionStreak = 0;
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
  var firstWinBlock = 0;
  var secondWinBlock = 0;
  var thirdWinBlock = 0;
  var anyTitles = false;
  var lossesBlock = 0;
  if (wres.wrestlers) {
    wresSize = wres.wrestlers.length;
  }
  var weeksSince = 999;

  var whichTitleBuffs = 0;

  //it should go backwards thru the last 15 matches to find the last 5 matches of the proper size and the last 5 title matches
  for (let i = wres.boosts.length - 1; i >= 0; i--) {
    if ((!anyTitles || titleStreakStop) && streakStop && lossesBlock >= 3) {
      break;
    }
    var boost = wres.boosts[i];
    if (boost.info.date.getYear() < currentDate.getYear()) {
      streakStop = true;
    }

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
    if (lossesBlock < 3) {
      if (boost.win == 1) {
        if (lossesBlock == 0) {
          firstWinBlock++;
        } else if (lossesBlock == 1) {
          secondWinBlock++;
        } else if (lossesBlock == 2) {
          thirdWinBlock++;
        }
      } else if (boost.win < 1) {
        lossesBlock++;
      }
    }

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
        if (wresSize == boost.sideSize) {
          divisionStreak++;
        }
      }
    }
    if (boost.titleMod > 1 && titleCount < 5) {
      anyTitles = true;
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

    if ((singlesCount >= 10 && titleCount >= 5) || matchingCount >= 15) {
      break;
    }
  }
  //arr 1: debuffs for losing streak. arr 2: buffs for winning streak
  var buffs = [
    [-0.05, -0.2, -0.3, -0.4, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5],
    [0.05, 0.15, 0.2, 0.25, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
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
  if (lastResult == 0 || lastResult == 1) {
    streakMod = buffs[lastResult][streak - 1];
  }
  var titleMod = titleBuffs[whichTitleBuffs][titleStreak];
  if (lastTitleResult == 0) {
    titleMod = titleMod * -1;
  }
  if (lastResult == 1) {
    streakMod = streakMod * buffWeeksDecay[weeksSince];
  }
  power = power * (1 + streakMod) * (1 + titleMod);

  // RECORD MODIFIERS
  if (wres.recordYear.overallWins == 0) {
    var toDrop = wres.recordYear.overallLosses;
    if (toDrop > 5) {
      toDrop = 5;
    }
    power = power * (1 - 0.1 * toDrop);
  }
  var recordTotal =
    wres.recordYear.overallWins +
    wres.recordYear.overallLosses +
    wres.recordYear.overallDraws;
  var targetWins = wres.recordYear.singlesWins;
  var targetLosses = wres.recordYear.singlesLosses;
  var targetDraws = wres.recordYear.singlesDraws;
  if (wresSize == 2) {
    targetWins = wres.recordYear.tagWins;
    targetLosses = wres.recordYear.tagLosses;
    targetDraws = wres.recordYear.tagDraws;
  } else if (wresSize == 3) {
    targetWins = wres.recordYear.trioWins;
    targetLosses = wres.recordYear.trioLosses;
    targetDraws = wres.recordYear.trioDraws;
  }

  var targetTotal = targetWins + targetLosses + targetDraws;
  if (recordTotal > 5) {
    if (recordTotal > 10) {
      recordTotal = 10;
    }
    power = power * (1 + 0.0025 * targetTotal);
  } else {
    if (wresSize == 1) {
      power = power * (1 - 0.04 * (5 - targetTotal));
    } else if (wresSize == 2) {
      // nerfing small record debuffs for teams and trios. they have less matches overall and it's GUTTING the trios division
      power = power * (1 - 0.03 * (5 - targetTotal));
    } else if (wresSize == 3) {
      power = power * (1 - 0.02 * (5 - targetTotal));
    }
  }
  var recordX = targetWins > targetLosses ? 0.2 : 0.5;
  var recordBoost =
    1 +
    ((targetWins - targetLosses) *
      (1 + (targetTotal * recordX - 1.005 ** targetTotal))) /
      100;
  power = power * recordBoost;

  var finalStreak = lastResult == 1 ? streak : streak * -1;

  var finalStreakFact = {
    wins: 0,
    overall: 0,
  };

  if (
    thirdWinBlock > (firstWinBlock + secondWinBlock) * 0.5 ||
    (firstWinBlock + secondWinBlock < 5 && thirdWinBlock > 2)
  ) {
    finalStreakFact.wins = firstWinBlock + secondWinBlock + thirdWinBlock;
    finalStreakFact.overall = finalStreakFact.wins + 2;
  } else {
    finalStreakFact.wins = firstWinBlock + secondWinBlock;
    finalStreakFact.overall = finalStreakFact.wins + 1;
  }

  return {
    power: power,
    streak: finalStreak,
    streakFact: finalStreakFact,
  };
}

function findInnerTeams(ids, teamMap, idPower, masterKey, date) {
  var inTeam = new Map();
  var singles = new Map();
  var singleUsed = new Map();
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
        // if (!inTeam.has(id1) && !inTeam.has(id2)) {
        //   inTeam.set(id1, team);
        //   inTeam.set(id2, team);
        // } else if (inTeam.has(id1)) {
        //   if (inTeam.get(id1).boosts.length > team.boosts.length) {
        //     continue;
        //   }
        // } else if (inTeam.has(id2)) {
        //   if (inTeam.get(id2).boosts.length > team.boosts.length) {
        //     continue;
        //   }
        // }
        // inTeam.delete(id1);
        // inTeam.delete(id2);
        var calcReturn = calcWrestlerPower(team, date);
        team.boosts = calcReturn.boosts;
        team.power = Math.round(calcReturn.power);
        team.record = calcReturn.record;
        team.recordYear = calcReturn.recordYear;
        inTeam.set(newKey, team);
        // inTeam.set(id2, team);
        singleUsed.set(id1);
        singleUsed.set(id2);
        teamMap.set(newKey, team);
      }
    }
  }
  for (let id of ids) {
    if (!singleUsed.has(id)) {
      singles.set(id, idPower.get(id));
    }
  }
  return {
    inTeam: inTeam,
    singles: singles,
    teamMap: teamMap,
  };
}

exports.calcRankings = async (req, res) => {
  try {
    // throw Error('STOPPING');
    var newShow;
    if (req.body.show) {
      newShow = req.body.show;
    }
    var shows = await Show.find();
    var latestDate = null;
    // // UNCOMMENT THIS IF WE WANT TO COMPLETELY SKIP SHOW CALC
    // latestDate = shows[shows.length - 1].date;
    // shows = [];
    var showCount = 0;
    var wresMap = new Map();
    var teams = await Team.find();
    var teamMap = new Map();
    //it should only reset team boosts if we're doing a total recalc
    for (let team of teams) {
      //reset the boosts on the teams every time - since we're pulling from the DB for these, gotta make sure the slate is clean
      if (!newShow) {
        team.boosts = [];
      }
      teamMap.set(JSON.stringify(team.wrestlers.sort()), team);
    }
    if (newShow) {
      // so if there's a newShow, it should be a recalc triggered by a new addition
      // IF THIS WORKS: it should load the existing data and set up a wresMap that matches the ones created in the larger shows loop
      // then change the shows array to just include the new show
      // so it SHOULD only calculate the relevant wrestlers changed in the newly added show
      // which means now when i add a new show i don't have to wait through an entire recalculation

      // NO THAT IS WRONG. when it only calcs on the new show, it doesn't apply decay to everyone else
      // if it's got newShow, then we load up wresMap with every single wrestler. teamMap is already loaded from above
      // then it should only do elo shit on the new show, but do powercalc on everyone

      var allWres = await Wrestler.find();

      for (let w of allWres) {
        var newWres = {
          name: w.name,
          power: w.power,
          startPower: w.startPower,
          boosts: w.boosts,
          id: w._id,
        };
        wresMap.set(w.name, newWres);
      }
      shows = [newShow];
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
        const kFactor = startingPower * 0.15;
        //x-factor affects the change brought on by the difference between winner and loser
        // a higher number seems to lead to bigger changes, but not by a ton

        const xFactor = startingPower * 0.4;

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

            if (w.forbiddenDoor) {
              newWres.power = 3500;
              newWres.startPower = 3500;
            } else if (!w.allElite) {
              newWres.power = 2500;
              newWres.startPower = 2500;
            }
            wresMap.set(w.name, newWres);
          }
          winnerSide.names.push(w.name);
          var wres = wresMap.get(w.name);
          if (wres.boosts.length > 0) {
            //if the wrestler has any boosts, then calculate their most recent power - BEFORE adding it to the average used to rate the newest boost
            var calcReturn = calcWrestlerPower(wres, show.date);
            wres.boosts = calcReturn.boosts;
            wres.power = Math.round(calcReturn.power);
            wres.record = calcReturn.record;
            wres.recordYear = calcReturn.recordYear;
          } else {
            wres.power = wres.startPower;
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
          var calcReturn = calcWrestlerPower(team, show.date);
          team.boosts = calcReturn.boosts;
          team.power = Math.round(calcReturn.power);
          team.record = calcReturn.record;
          team.recordYear = calcReturn.recordYear;
          teamMap.set(winnerKey, team);
          var innerTeamResults = findInnerTeams(
            winnerIDs,
            teamMap,
            idPower,
            winnerKey,
            show.date
          );
          teamMap = innerTeamResults.teamMap;
          var inTeam = innerTeamResults.inTeam;
          var alreadyUsed = new Map();
          for (let [key, value] of inTeam) {
            if (!alreadyUsed.has(value.name)) {
              alreadyUsed.set(value.name);
              winnerSide.innerTeamKeys.push(
                JSON.stringify(value.wrestlers.sort())
              );
            }
          }
          winnerSide.teamKey = winnerKey;
          winnerSide.avgPower = team.power;
        } else if (match.winner.length > 2) {
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
          var singles = innerTeamResults.singles;
          teamMap = innerTeamResults.teamMap;

          // go through the idpower map, skip everyone thats also in the inteam map, add their power to totalpower and increase totalteamcount
          // side note: there's definitely a specific word for increasing a value by 1 but i can't remember it
          for (let [key, value] of singles) {
            totalTeamPower += value;
            totalTeamCount++;
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
              if (w.forbiddenDoor) {
                newWres.power = 4000;
                newWres.startPower = 4000;
              } else if (!w.allElite) {
                newWres.power = 2500;
                newWres.startPower = 2500;
              }
              if (!wresMap.has(w.name)) {
                wresMap.set(w.name, newWres);
              }
            }
            var wres = wresMap.get(w.name);
            newLoser.names.push(w.name);

            if (wres.boosts.length > 0) {
              var calcReturn = calcWrestlerPower(wres, show.date);
              wres.boosts = calcReturn.boosts;
              wres.power = calcReturn.power;
              wres.record = calcReturn.record;
              wres.recordYear = calcReturn.recordYear;
            } else {
              wres.power = wres.startPower;
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
            var calcReturn = calcWrestlerPower(team, show.date);
            team.boosts = calcReturn.boosts;
            team.power = Math.round(calcReturn.power);
            team.record = calcReturn.record;
            team.recordYear = calcReturn.recordYear;
            teamMap.set(loserKey, team);
            var innerTeamResults = findInnerTeams(
              loserIDs,
              teamMap,
              idPower,
              loserKey,
              show.date
            );
            teamMap = innerTeamResults.teamMap;
            var inTeam = innerTeamResults.inTeam;
            var alreadyUsed = new Map();
            if (inTeam.size > 0) {
              for (let [key, value] of inTeam) {
                if (!alreadyUsed.has(value.name)) {
                  alreadyUsed.set(value.name);
                  newLoser.innerTeamKeys.push(
                    JSON.stringify(value.wrestlers.sort())
                  );
                }
              }
            }
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
            var singles = innerTeamResults.singles;

            teamMap = innerTeamResults.teamMap;
            for (let [key, value] of singles) {
              totalTeamPower += value;
              totalTeamCount++;
            }

            var alreadyUsed = new Map();
            if (inTeam.size > 0) {
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
          var loserAvg = Math.round(loserSum / loserSides.length);
          var expWin = 1 / (1 + 10 ** ((loserAvg - wres.power) / xFactor));

          var showMod = calcShowMod(show, match, true);
          if (expWin === Number.POSITIVE_INFINITY) {
            console.log('CORRECTING INFINITY');
            expWin = 1.000000000001;
          }
          var actualWin = 1;
          if (match.result.includes('Draw')) {
            actualWin = 0.67;
          } else if (match.result.includes('No Contest')) {
            actualWin = 0.5;
          }
          var powChange = titleMod * kFactor * (actualWin - expWin);

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
            singleChange = powChange * 0.35;
            //FIRST THINGS FIRST. we need to check if this boost already exists, so it doesn't get added for every member of the team
            var newBoost = {
              info: {
                string: '',
                result: match.result,
                time: match.time,
                date: show.date,
              },
              startPower: powChange,
              currentPower: powChange,
              win: actualWin,
              sideSize: match.winner.length,
              showMod: showMod,
              titleMod: titleMod,
              match: match._id,
            };
            team.boosts = checkBoost(newBoost, team);
            teamMap.set(winnerSide.teamKey, team);
          } else if (match.winner.length > 1) {
            //if it's a tag match but it isn't an established team, then it's 50%
            singleChange = powChange * 0.55;
          }
          newBoost = {
            info: {
              string: '',
              result: match.result,
              time: match.time,
              date: show.date,
            },
            startPower: singleChange,
            currentPower: singleChange,
            win: actualWin,
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
            var winnerAvg = Math.round(powerSum / opponentCount);
            var expWin = 1 / (1 + 10 ** ((winnerAvg - wres.power) / xFactor));
            if (expWin === 0) {
              console.log(
                `FUCK: ${winnerAvg} | ${wres.power} | ${kFactor} | ${actualWin} | ${expWin}`
              );
            }
            if (expWin === Number.POSITIVE_INFINITY) {
              console.log('CORRECTING INFINITY');
              expWin = 1.000000000001;
            }

            var showMod = calcShowMod(show, match, false);
            var actualWin = 0;

            if (match.result.includes('Draw')) {
              actualWin = 0.67;
            } else if (match.result.includes('No Contest')) {
              actualWin = 0.5;
            }

            var powChange = titleMod * kFactor * (actualWin - expWin);

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
                currentPower: powChange,
                win: actualWin,
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
              currentPower: singleChange,
              win: actualWin,
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
      wres.boosts = calcPower.boosts;
      wres.record = calcPower.record;
      wres.recordYear = calcPower.recordYear;
      wres.startPower = value.startPower;
      var streakResults = calcStreak(
        wres,
        Math.round(calcPower.power),
        latestDate
      );
      // if the most recent match is a loss, it needs a BIG ACROSS THE BOARD NERF.
      wres.power = Math.round(streakResults.power);
      wres.streak = streakResults.streak;
      wres.streakFact = streakResults.streakFact;

      if (calcPower.singlesGap >= 28) {
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

      var calcPower = calcWrestlerPower(value, latestDate);
      team.boosts = calcPower.boosts;
      team.record = calcPower.record;
      team.recordYear = calcPower.recordYear;
      team.startPower = value.startPower;

      var streakResults = calcStreak(
        team,
        Math.round(calcPower.power),
        latestDate
      );
      team.power = Math.round(streakResults.power);
      team.streak = streakResults.streak;
      team.streakFact = streakResults.streakFact;
      team.male = value.male;

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

    await calcPowerHistory(req, res, latestDate);

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
