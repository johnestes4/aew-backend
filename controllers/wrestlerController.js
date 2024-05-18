const Wrestler = require('./../models/wrestler');
const Match = require('./../models/match');
const Show = require('./../models/show');
const MatchTitleProxy = require('./../models/matchTitleProxy');
const TitleReign = require('./../models/titleReign');
const Title = require('./../models/title');
const Team = require('./../models/team');

const APIFeatures = require('./../utils/apiFeatures');

exports.male = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.male = { $eq: 'true' };
  next();
};
exports.female = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.male = { $eq: 'false' };
  next();
};

exports.getAllWrestlers = async (req, res) => {
  try {
    const features = new APIFeatures(
      Wrestler.find().populate({
        path: 'titles',
        model: TitleReign,
      }),
      req.query
    )
      .filter()
      .sort('name')
      .limitFields();
    // await executes the query and returns all the documents
    const wrestlers = await features.query;

    res.status(200).json({
      status: 'success',
      results: wrestlers.length,
      data: {
        wrestlers,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.getWrestlerRankings = async (req, res) => {
  try {
    const features = new APIFeatures(
      Wrestler.find({ active: 'true', allElite: 'true' }),
      req.query
    )
      .filter()
      .sort('-power')
      .limitFields('name,power,male');
    // await executes the query and returns all the documents
    const wrestlers = await features.query;

    res.status(200).json({
      status: 'success',
      results: wrestlers.length,
      data: {
        wrestlers,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getWrestler = async (req, res) => {
  try {
    const wrestler = await Wrestler.findById(req.params.id).populate({
      path: 'titles',
      model: TitleReign,
      populate: {
        path: 'title',
        model: Title,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { wrestler },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createWrestler = async (req, res) => {
  try {
    const newWrestler = await Wrestler.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        wrestler: newWrestler,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateWrestler = async (req, res) => {
  try {
    const wrestler = await Wrestler.findByIdAndUpdate(req.params.id, req.body, {
      //this third argument makes sure the new document is the one that gets returned
      new: true,
      //this validates the operation against the model's schema
      //presumably it helps stop invalid changes
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: { wrestler },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteWrestler = async (req, res) => {
  try {
    await Wrestler.findByIdAndDelete(req.params.id);
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

makeNameString = async (names, winner) => {
  function testTeam(found, members, teamMap) {
    for (let w of members) {
      if (teamMap.has(w)) {
        if (
          teamMap.get(w).boosts.length > found.boosts.length &&
          teamMap.get(w).wrestlers.length >= found.wrestlers.length
        ) {
          break;
        } else {
          for (let teamId of teamMap.get(w).wrestlers) {
            teamMap.delete(teamId);
          }
        }
      }
      teamMap.set(w, found);
    }
    return teamMap;
  }
  try {
    var nameOut = '';
    //winners are added before the losers, so i think once you hit a loser you're all past the winners, right?
    //so theoretically you should just break the loop once
    if (Array.isArray(names[0])) {
      var sideString = '';
      for (let i = 0; i < names.length; i++) {
        nameOut += await makeNameString(names[i], winner);
        if (names.length > 1) {
          if (i < names.length - 1) {
            nameOut += ', ';
          }
        }
      }
    } else {
      var teamMap = new Map();
      var singles = [];
      var singleNames = [];
      var teamNames = [];
      for (let i = 0; i < names.length; i++) {
        if (names[i].won !== winner) {
          continue;
        }
        if (i < names.length - 1) {
          //make a comboID for each subsequent guy, use it to find a tag team
          //if it finds two separate tag teams, first check if there's a ( in it
          //if so, it's probably a faction: cut off everything before the ( and use that
          //if not, check the team's boost count versus the boost count of the existing one
          //keep the one with more matches
          for (let i2 = i + 1; i2 < names.length; i2++) {
            if (names[i2].won !== winner) {
              break;
            }
            if (i2 < names.length - 1) {
              for (let i3 = i2 + 1; i3 < names.length; i3++) {
                var members = [names[i].id, names[i2].id, names[i3].id].sort();
                var comboID = JSON.stringify(members);
                var found = await Team.findOne({ comboID: comboID });
                if (found) {
                  teamMap = testTeam(found, members, teamMap);
                }
              }
            }
            var members = [names[i].id, names[i2].id].sort();
            var comboID = JSON.stringify(members);
            // console.log(comboID);
            var found = await Team.findOne({ comboID: comboID });
            if (found) {
              teamMap = testTeam(found, members, teamMap);
            }
          }
        }
        singles.push();
      }
      for (let n of names) {
        if (!teamMap.has(n.id)) {
          singleNames.push(n.name);
        }
      }
      // singleNames = singleNames.sort();
      for (let i = 0; i < singleNames.length; i++) {
        if (i == singleNames.length - 1 && teamMap.size == 0) {
          if (nameOut.slice(-1) !== ' ') {
            nameOut = nameOut + ' ';
          }
          nameOut = nameOut + '& ';
        }
        nameOut = nameOut + singleNames[i];
        if (singleNames.length > 2 && i < singleNames.length - 1) {
          nameOut = nameOut + ', ';
        }
      }
      if (teamMap.size > 0) {
        var namesUsed = new Map();
        for (let [key, value] of teamMap) {
          if (!namesUsed.has(value.name)) {
            teamNames.push(value.name);
            namesUsed.set(value.name);
          }
        }
        if (nameOut.length > 0) {
          if (teamNames.length == 1) {
            nameOut = nameOut + ' & ';
          } else if (teamNames.length > 1) {
            nameOut = nameOut + ', ';
          }
        }
        teamNames = teamNames.sort();
        for (let i = 0; i < teamNames.length; i++) {
          nameOut = nameOut + teamNames[i];
          if (teamNames.length > 2 && i < teamNames.length - 2) {
            nameOut = nameOut + ', ';
          } else if (teamNames.length > 2 && i < teamNames.length - 1) {
            nameOut = nameOut + ', & ';
          } else if (i < teamNames.length - 1) {
            nameOut = nameOut + ' & ';
          }
        }
      }
    }
    return nameOut;
  } catch (err) {
    console.log(err);
    return 'FUCK';
  }
};

exports.generateRecord = async (req, res) => {
  try {
    const allMatches = await Match.find({
      $or: [
        { winner: { $in: req.params.id } },
        { loser: { $in: req.params.id } },
      ],
    })
      .populate({
        path: 'winner loser',
        model: Wrestler,
      })
      .populate({
        path: 'show',
        model: Show,
      })
      .populate({
        path: 'title',
        model: MatchTitleProxy,
      });
    var count = 0;
    var allRecord = [];

    var count = 1;
    for (let match of allMatches) {
      console.log(`${count}...`);
      if (match.winner.length >= 2 && match.winner.length <= 3) {
        winnerCombo = JSON.stringify(match.winner.sort());
      }
      var winnerNames = [];
      var loserNames = [];
      const newResult = {
        match: match._id,
        show: match.show._id,
        date: match.show.date,
        titles: [],
        matchType: match.matchType,
        mainEvent: match.mainEvent,
      };
      const winArr = [];
      const loseArr = [];
      for (let w of match.winner) {
        if (!w.record) {
          w.record = [];
        }
        winnerNames.push(w.name);
        winArr.push({
          name: w.name,
          id: w._id,
          won: true,
        });
        if (match.winner > 1 && match.winner < 4) {
          var comboID = JSON.stringify(match.winner.sort());
          var team = Team.findOne({ comboID: comboID });
          if (team) {
            newResult.teams.push({
              name: team.name,
              id: team._id,
              won: true,
            });
          }
        }
      }
      for (let w2 of match.loser) {
        var losingSideNames = [];
        for (let w of w2) {
          losingSideNames.push(w.name);
          loseArr.push({
            name: w.name,
            id: w._id,
            won: false,
          });
        }
        loserNames.push(losingSideNames);
      }
      newResult.wrestlers = winArr.concat(loseArr);
      newResult.winnerString = await makeNameString(winArr, true);
      newResult.loserString = await makeNameString(loseArr, false);
      for (let t of match.title) {
        var title = await Title.findById(t.title);
        newResult.titles.push({
          name: title.name,
          id: title._id,
        });
      }
      allRecord.push(newResult);
      count++;
    }
    allRecord = allRecord.reverse();

    res.status(200).json({
      status: 'success',
      data: { allRecord },
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
