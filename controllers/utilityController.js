const TitleReign = require('../models/titleReign');
const Title = require('../models/title');
const Match = require('./../models/match');
const Team = require('./../models/team');
const Show = require('../models/show');
const Wrestler = require('../models/wrestler');
const MatchTitleProxy = require('./../models/matchTitleProxy');
const teamController = require('../controllers/teamController');

const fs = require('fs');

const APIFeatures = require('../utils/apiFeatures');

exports.cleanAliases = async (req, res) => {
  try {
    const featuresW = new APIFeatures(Wrestler.find(), req.query).limitFields(
      'name,aliases'
    );
    const wrestlers = await featuresW.query;

    const featuresM = new APIFeatures(Match.find(), req.query).limitFields(
      'winner,loser'
    );
    const matches = await featuresM.query;

    const featuresT = new APIFeatures(TitleReign.find(), req.query).limitFields(
      'champion'
    );
    const reigns = await featuresT.query;

    var wresMap = new Map();
    console.log('here');
    for (let wres of wrestlers) {
      if (wres.aliases.length < 1) {
        continue;
      }
      for (let a of wres.aliases) {
        // console.log(a);
        var badWres = await Wrestler.findOne({ name: a });
        // throw Error('STOPPING HERE');
        if (badWres) {
          // console.log(badWres.name);
          // if (badWres.length > 1) {
          // }
          // console.log(badWres.name);
          // console.log(`${badWres.name} >> ${badWres._id}`);
          wresMap.set(badWres._id.toString(), {
            name: a,
            goodId: wres._id,
          });
        }
      }
    }
    //go thru matches, replace bad ids with good ones
    for (let match of matches) {
      var needsUpdate = false;
      for (let i = 0; i < match.winner.length; i++) {
        const w = match.winner[i];
        if (wresMap.has(w.toString())) {
          needsUpdate = true;
          // console.log(`<<OLD | ${w} | OLD>>`);
          match.winner[i] = wresMap.get(w.toString()).goodId;
          // console.log('<<NEW | ' + w + ' | NEW>>');
        }
      }
      for (let l1 of match.loser) {
        for (let i = 0; i < l1.length; i++) {
          const l2 = l1[i];
          var l2index = 0;
          if (l2 !== null) {
            if (wresMap.has(l2.toString())) {
              needsUpdate = true;
              // console.log(`${l2} > ${wresMap.get(l2.toString()).goodId}`);
              l1[i] = wresMap.get(l2.toString()).goodId;
            }
          } else {
            needsUpdate = true;
            l1.splice(l2index, 1);
          }
          l2index++;
        }
      }
      if (needsUpdate) {
        await Match.findByIdAndUpdate(match._id, match);
      }
    }
    //same for reigns
    for (let reign of reigns) {
      var needsUpdate = false;
      for (let i = 0; i < reign.champion.length; i++) {
        c = reign.champion[i];
        if (wresMap.has(c.toString())) {
          needsUpdate = true;
          reign.champion[i] = wresMap.get(c.toString()).goodId;
        }
      }
      if (needsUpdate) {
        await TitleReign.findByIdAndUpdate(reign._id, reign);
      }
    }
    //NOW we go delete all the, hopefully now fully obsolete, alias wrestlers.
    for (let [key, value] of wresMap) {
      // console.log(key);
      await Wrestler.findByIdAndDelete(key);
    }

    res.status(201).json({
      status: 'success',
      data: 'Check the DB to see how successful it was!',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.attachTitles = async (req, res) => {
  try {
    const wrestlers = await Wrestler.find();
    const titleReigns = await TitleReign.find();

    const wresMap = new Map();

    for (let reign of titleReigns) {
      for (let champID of reign.champion) {
        var champ;
        if (wresMap.has(champID.toString())) {
          champ = wresMap.get(champID.toString());
        } else {
          champ = await Wrestler.findById(champID);
          champ.titles = [];
        }
        champ.titles.push(reign._id);
        wresMap.set(champID.toString(), champ);
      }
    }

    var count = 0;
    for (let [key, value] of wresMap) {
      console.log(value.name + ' | ' + value.titles.length);
      await Wrestler.findByIdAndUpdate(value._id, value);
      count++;
    }

    res.status(200).json({
      status: 'success',
      message: `updated ${count} entries`,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.quickTitleUpdate = async (req, res) => {
  try {
    const titles = await Title.find();
    const titleReigns = await TitleReign.find()
      .populate({
        path: 'title',
        model: Title,
      })
      .populate({
        path: 'startShow',
        model: Show,
      });
    for (let title of titles) {
      if (!title.promotion) {
        if (
          title.name.includes('AEW') ||
          title.name.includes('FTW') ||
          title.name.includes('Dynamite')
        ) {
          title.promotion = 'AEW';
        } else if (title.name.includes('Impact')) {
          title.promotion = 'TNA';
        } else if (title.name.includes('IWGP') || title.name.includes('NJPW')) {
          title.promotion = 'NJPW';
        } else if (title.name.includes('NWA')) {
          title.promotion = 'NWA';
        } else if (title.name.includes('ROH')) {
          title.promotion = 'ROH';
        } else if (title.name.includes('AAA')) {
          title.promotion = 'AAA';
        } else if (title.name.includes('CMLL')) {
          title.promotion = 'CMLL';
        } else if (title.name.includes('WAVE')) {
          title.promotion = 'WAVE';
        }
      }
      if (!title.currentChampion || title.currentChampion.length < 1) {
        var mostRecentReign = null;
        for (let reign of titleReigns) {
          if (reign.title._id.toString() == title._id.toString()) {
            title.reigns.push(reign._id);
            if (!reign.endShow) {
              // console.log(reign.startShow.date);
              if (
                mostRecentReign == null ||
                mostRecentReign.startShow.date.getTime() <
                  reign.startShow.date.getTime()
              ) {
                mostRecentReign = reign;
              }
            }
          }
        }
        if (mostRecentReign !== null) {
          for (let champ of mostRecentReign.champion) {
            title.currentChampion.push(champ);
          }
        }
      }
      await Title.findByIdAndUpdate(title._id, title);
    }

    res.status(200).json({
      status: 'success',
      message: 'Title fix completed',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.scanTeams = async (req, res) => {
  try {
    const matches = await Match.find();
    var teamMaster = [];
    for (let match of matches) {
      if (match.winner.length > 1) {
        //1 for if they won, 0 if they didn't. so we can use wins as a separate metric for judging teams. even tho i doubt i need to, whatever, i want to write the logic
        teamMaster = calcTeams(match.winner, teamMaster, 1);
      }
      for (loser of match.loser) {
        if (loser.length > 1) {
          teamMaster = calcTeams(loser, teamMaster, 0);
        }
      }
    }
    for (let team of teamMaster) {
      // console.log(value.times);
      //3 wins or 5 overall qualifies you for an entry
      if (team.wins >= 4 || team.times >= 6) {
        var partner1 = await Wrestler.findById(team.members[0]);
        var partner2 = await Wrestler.findById(team.members[1]);
        var teamName = `${partner1.name}, ${partner2.name}`;
        var partner3 = null;
        if (team.members.length == 3) {
          partner3 = await Wrestler.findById(team.members[2]);
          teamName += `, ${partner3.name}`;
        }
        console.log(`${teamName} | ${team.wins} WINS / ${team.times} MATCHES`);

        const newTeam = {
          name: teamName,
          wrestlers: team.members,
          power: 500,
          faction: false,
          active: true,
          boosts: [],
        };
        await Team.create(newTeam);
      }
    }
    res.status(201).json({
      status: 'success',
      data: 'Teams created',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

function calcTeams(teamArray, teamMaster, won) {
  function checkForWrestler(teamTarget, teamToCheck) {
    //this should recursively go thru array 1, find matches in array 2, remove those matches from array 1 when they're found, then recurse until array 1 is empty
    for (let masterWres of teamToCheck) {
      for (let i = 0; i < teamTarget.length; i++) {
        var wres = teamTarget[i];
        if (wres == masterWres) {
          teamTarget.splice(i, 1);
          teamTarget = checkForWrestler(teamTarget, teamToCheck);
        }
      }
    }
    return teamTarget;
  }
  if (teamArray.length > 1 && teamArray.length <= 3) {
    var teamArrayWarped = { ...teamArray };
    //go thru the list of master teams, then run checkForWrestler on each one
    //see if any of the teams in master match the team i'm looking for
    var matchFound = false;
    for (let team of teamMaster) {
      if (
        JSON.stringify(team.members.sort()) == JSON.stringify(teamArray.sort())
      ) {
        // console.log('found');
        team.times++;
        team.wins += won;
        matchFound = true;
        break;
      }
    }
    if (!matchFound) {
      teamMaster.push({
        members: teamArray.sort(),
        times: 1,
        wins: won,
      });
    }
  }
  return teamMaster;
}

exports.generateTeamComboIDs = async (req, res) => {
  try {
    const teams = await Team.find();
    var count = 0;
    for (let team of teams) {
      var wresArray = [];
      for (let wres of team.wrestlers) {
        wresArray.push(wres);
      }
      team.comboID = JSON.stringify(wresArray.sort());
      await Team.findByIdAndUpdate(team._id, team);
      count++;
    }
    res.status(201).json({
      status: 'success',
      data: `Created ${count} comboIDs`,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.attachTitleTeams = async (req, res) => {
  const titles = await Title.find();
  for (let title of titles) {
    if (title.currentChampion.length > 1) {
      const comboID = JSON.stringify(title.currentChampion.sort());
      const team = await Team.findOne({ comboID: comboID });
      if (team) {
        title.currentChampionTeam = team._id;
        await Title.findByIdAndUpdate(title._id, title);
      } else {
        // used this to track which champion teams aren't there - jay and the gunns aren't, which is weird, but eventually i'll be able to manually create them
        // console.log('____FAILED BLOCK BELOW____');
        // for (let w of title.currentChampion) {
        //   var w2 = await Wrestler.findById(w);
        //   console.log(w2.name);
        // }
        // console.log('--------------------------');
      }
    }
  }

  try {
    const matches = await Match.find();
    res.status(201).json({
      status: 'success',
      data: 'Teams created',
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.attachMatches = async (req, res) => {
  try {
    var count = 0;
    const shows = await Show.find({ matches: { $size: '0' } });
    for (let show of shows) {
      const matches = await Match.find({ show: show._id });
      for (let match of matches) {
        show.matches.push(match._id);
      }
      await Show.findByIdAndUpdate(show._id, show);
      count++;
    }
    res.status(200).json({
      status: 'success',
      message: `Fixed ${count} shows`,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

//We've got an issue with losers in tag matches. they didn't process properly, and they're split into separate arrays when they should be one
//here we're going to iterate thru all matches, find everything with winner.length > 1
//if winner.length > loser.length, it's an imbalance, and we reshuffle arrays until it matches
exports.cleanTagMatches = async (req, res) => {
  try {
    const allMatches = await Match.find();
    var numFixed = 0;

    for (let match of allMatches) {
      //if the winner length is 1, it's not the dynamite dozen, and it's not a handicap match
      if (
        (match.winner.length < 2 || match.matchType.includes('Dozen')) &&
        !match.matchType.includes('Handicap')
      ) {
        continue;
      }
      //i don't think there's any instances of this happening with the array lengths being longer than 1. it's all cases where wrestlers each got an individual array
      if (match.loser[0].length == 1) {
        var newLoserArray = [];
        for (let l of match.loser) {
          newLoserArray.push(l[0]);
        }
        //just one more layer here to make sure they should be combined. pretty sure it will work tho
        //DO have to make sure that if it's a handicap match and the bigger team loses, we combine them
        if (
          newLoserArray.length == match.winner.length ||
          (match.matchType.includes('Handicap') &&
            newLoserArray.length > match.winner.length)
        ) {
          match.loser = [newLoserArray];
          await Match.findByIdAndUpdate(match._id, match);
          numFixed++;
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: `fixed ${numFixed} matches`,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.attachImages = async (req, res) => {
  try {
    const imgNames = new Map();
    //check against a folder that's currently in the dir that contains every image. get a big list to compare
    await fs.readdir('./profile', { withFileTypes: true }, (err, files) => {
      files.forEach((file) => {
        // console.log(file.name.slice(0, -4));
        imgNames.set(
          file.name.slice(0, -4),
          `./assets/img/profile/${file.name}`
        );
      });
    });
    const allWrestlers = await Wrestler.find();
    var count = 0;
    for (let wres of allWrestlers) {
      //process the names to match the naming convention of the profile images. the way i set them up, they should match
      var name = wres.name.replace(/[\s,\./]+/g, '').toLowerCase();
      if (imgNames.has(name)) {
        wres.profileImage = imgNames.get(name);
        await Wrestler.findByIdAndUpdate(wres._id, wres);
        count++;
      }
    }
    // const testWres = await Wrestler.findById('660f3bf7b82fe2310454e6da');
    // console.log(testWres.name.replace(/[\s,\./]+/g, '').toLowerCase());

    res.status(200).json({
      status: 'success',
      message: `Added ${count} images`,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

// exports.inactivitySweep = async (req, res) => {
//   try {
//     res.status(201).json({
//       status: 'success',
//       data: `Created ${count}`,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };
