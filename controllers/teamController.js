const Team = require('./../models/team');
const Wrestler = require('./../models/wrestler');
const Match = require('./../models/match');

const APIFeatures = require('./../utils/apiFeatures');

exports.getAllTeams = async (req, res) => {
  try {
    const features = new APIFeatures(Team.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // await executes the query and returns all the documents
    const teams = await features.query;

    res.status(200).json({
      status: 'success',
      results: teams.length,
      data: {
        teams,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { team },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const newTeam = await Team.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        team: newTeam,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      //this third argument makes sure the new document is the one that gets returned
      new: true,
      //this validates the operation against the model's schema
      //presumably it helps stop invalid changes
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: { team },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.scanTeams = async (req, res) => {
  try {
    const matches = await Match.find();
    var teamMap = new Map();
    for (let match of matches) {
      if (match.winner.length > 1) {
        //1 for if they won, 0 if they didn't. so we can use wins as a separate metric for judging teams. even tho i doubt i need to, whatever, i want to write the logic
        teamMap = calcTeams(match.winner, teamMap, 1);
      }
      for (loser of match.loser) {
        if (loser.length > 1) {
          teamMap = calcTeams(loser, teamMap, 0);
        }
      }
    }
    for (let [key, value] of teamMap) {
      // console.log(value.times);
      //3 wins or 5 overall qualifies you for an entry
      if (value.wins >= 3 || value.times >= 5) {
        var teamWrestlers = [key, value.partner1];
        var partner1 = await Wrestler.findById(key);
        var partner2 = await Wrestler.findById(value.partner1);
        var teamName = `${partner1.name}, ${partner2.name}`;
        console.log(teamName);
        var partner3 = null;
        if (value.partner2 !== null) {
          partner3 = await Wrestler.findById(value.partner2);
          teamWrestlers.push(value.partner2);
          teamName += `, ${partner3.name}`;
        }

        const newTeam = {
          name: teamName,
          wrestlers: teamWrestlers,
          power: 500,
          faction: false,
          active: true,
          boosts: [],
        };
        // await Team.create(newTeam);
      }
    }
    res.status(204).json({
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

function calcTeams(teamArray, teamMap, won) {
  if (teamArray.length > 1 && teamArray.length <= 3) {
    //hopefully this will allow it to properly adapt and know whether or not it found anything
    var teamToTest = null;
    var keyIndex = null;
    var partnerIndex = null;
    var partnerIndex2 = null;
    //should check each teammate for being key - then, if one returns a team, check the other one-two indexes against the partners
    //should also know to only check for a third partner if it's a 3man team
    if (teamMap.has(teamArray[0].toString())) {
      console.log('has 0');
      teamToTest = teamMap.get(teamArray[0].toString());
      keyIndex = 0;
      partnerIndex = 1;
      teamArray.length == 3 ? (partnerIndex2 = 2) : (partnerIndex2 = null);
    } else if (teamMap.has(teamArray[1].toString())) {
      console.log('has 1');
      teamToTest = teamMap.get(teamArray[1].toString());
      keyIndex = 1;
      partnerIndex = 0;
      teamArray.length == 3 ? (partnerIndex2 = 2) : (partnerIndex2 = null);
    } else if (teamArray.length == 3 && teamMap.has(teamArray[2].toString())) {
      console.log('has 2');
      teamToTest = teamMap.get(teamArray[2].toString());
      keyIndex = 2;
      partnerIndex = 0;
      partnerIndex2 = 1;
    }
    //the partnerindexes should correspond to the partners that are NOT the key
    //check partnerindex against partner1, then ONLY IF there is a partnerindex2, check that one too.
    //i think this will catch every possible setup of partners
    //although i think they're always going to be in alphabetical order anyway, but i'm not SURE, so now i can be sure
    //i don't want to have to write another script to combine duplicate teams f that i'm probably gonna have to write one to get team records on match records anyway
    if (teamToTest !== null) {
      // console.log(keyIndex);
      if (teamToTest.partner1 == teamArray[partnerIndex].toString()) {
        if (partnerIndex2 !== null) {
          if (teamToTest.partner2 == teamArray[partnerIndex2].toString()) {
            teamMap.get(teamArray[keyIndex].toString()).times++;
            teamMap.get(teamArray[keyIndex].toString()).wins += won;
          }
        } else {
          teamMap.get(teamArray[keyIndex].toString()).times++;
          teamMap.get(teamArray[keyIndex].toString()).wins += won;
        }
      } else if (partnerIndex2 !== null) {
        if (
          teamToTest.partner1 == teamArray[partnerIndex2].toString() &&
          teamToTest.partner2 == teamArray[partnerIndex].toString()
        ) {
          teamMap.get(teamArray[keyIndex].toString()).times++;
          teamMap.get(teamArray[keyIndex].toString()).wins += won;
        }
      }
    } else {
      var partner2 = null;
      if (teamArray.length > 2) {
        partner2 = teamArray[2];
      }
      teamMap.set(teamArray[0], {
        partner1: teamArray[1],
        partner2: partner2,
        times: 1,
        wins: won,
      });
    }
  }
  return teamMap;
}
