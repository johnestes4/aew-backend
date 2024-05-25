const Show = require('./../models/show');
const Match = require('./../models/match');
const Wrestler = require('./../models/wrestler');
const TitleReign = require('../models/titleReign');
const Title = require('./../models/title');
const Team = require('./../models/team');
const rankingsController = require('./rankingsController');
const APIFeatures = require('./../utils/apiFeatures');
const MatchTitleProxy = require('../models/matchTitleProxy');

exports.getAllShows = async (req, res) => {
  try {
    const features = new APIFeatures(
      Show.find().populate({
        path: 'matches',
        model: Match,
      }),
      req.query
    )
      .filter()
      .sort('-date')
      .limitFields();
    // await executes the query and returns all the documents
    const shows = await features.query;

    res.status(200).json({
      status: 'success',
      results: shows.length,
      data: {
        shows,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate({
      path: 'matches',
      model: Match,
      populate: {
        path: 'winner loser',
        model: Wrestler,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { show },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createShow = async (req, res) => {
  try {
    const newShow = await Show.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        show: newShow,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateShow = async (req, res) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
      //this third argument makes sure the new document is the one that gets returned
      new: true,
      //this validates the operation against the model's schema
      //presumably it helps stop invalid changes
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: { show },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
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

exports.newShow = async (req, res) => {
  try {
    var show = req.body;
    const newMatches = [];
    var newTitleReigns = new Map();
    var newTitleProxies = new Map();
    var titleChanges = new Map();
    for (let i = 0; i < show.matches.length; i++) {
      var match = show.matches[i];
      var wresToCreate = [];
      var wresMap = new Map();
      var matchMale = true;
      for (let wres of match.winner) {
        var found = await Wrestler.findOne({ name: wres });
        if (!found) {
          wresToCreate.push(wres);
        } else {
          wresMap.set(found.name, found);
          matchMale = found.male;
        }
      }
      for (let arr of match.loser) {
        for (let wres of arr) {
          var found = await Wrestler.findOne({ name: wres });
          if (!found) {
            wresToCreate.push(wres);
          } else {
            wresMap.set(found.name, found);
            matchMale = found.male;
          }
        }
      }
      for (let w of wresToCreate) {
        var newWres = new Wrestler();
        newWres.name = w;
        newWres.male = matchMale;
        // newWres = await Wrestler.create(newWres);
        wresMap.set(newWres.name, newWres);
      }
      for (let i2 = 0; i2 < match.winner.length; i2++) {
        match.winner[i2] = wresMap.get(match.winner[i2])._id;
      }
      for (let arr of match.loser) {
        for (let i2 = 0; i2 < arr.length; i2++) {
          arr[i2] = wresMap.get(arr[i2])._id;
        }
      }
      delete match._id;
      delete match.show;
      var titles = [].concat(match.title);
      var newMatch = await Match.create(match);
      if (newMatch.title.length > 0) {
        // console.log(match.title[0]);
        // throw Error('STOPPING');
        var newProxies = [];
        for (let titleId of titles) {
          var title = await Title.findById(titleId);
          newProxies.push({
            title: title._id,
            match: newMatch._id,
          });

          if (
            JSON.stringify(newMatch.winner.sort()) !==
            JSON.stringify(title.currentChampion.sort())
          ) {
            console.log('TITLE CHANGE');
            newTitleReigns.set(newMatch._id, {
              title: title._id,
              champion: newMatch.winner,
              loser: title.currentChampion,
            });
            title.currentChampion = newMatch.winner;
            if (newMatch.winner.length > 1) {
              var comboID = JSON.stringify(newMatch.winner);
              var team = Team.findOne({
                comboID: comboID,
              });
              if (team) {
                title.currentChampionTeam = team._id;
              }
            }
            titleChanges.set(title._id, title);
          }
        }
        newTitleProxies.set(newMatch._id, newProxies);
      }

      newMatches.push(newMatch);
      show.matches[i] = newMatch._id;
    }

    // throw new Error('STOPPING');

    /*
      SO AT THIS POINT.
      newTitleReigns has title id, the new champion, and loser to help find the existing one. Tied to match ID.
        it will need startShow as soon as the new show is created. Then it will be ready to be saved.
        Will also need to find the existing, open title reign and add new show as an endShow.
          (maybe make this an array in the future, next time a double title match happens)
      newTitleProxies has an array of title ids and match ids. Tied to match ID.
        Will need reignIn and, if it's a titlechange, reignOut.
      titleChanges has the updated title that we haven't saved yet. Tied to title ID.
        Will need any new reigns added to its reigns array.
    */
    delete show._id;
    show = await Show.create(show);
    for (let match of newMatches) {
      match.show = show._id;
      if (newTitleReigns.has(match._id) || newTitleProxies.has(match._id)) {
        var newProxy = newTitleProxies.get(match._id);
        /*
          HOW TO DEAL WITH TITLE REIGNS AND PROXIES
            if new title reigns has match id, then you know it's gonna be a title change.
              find a title reign for the right belt with the losers as champions. set show as endShow.
                  save updated old reign to DB
                    set as old reign reignIn for the new proxy
                create a new title reign for the new reign. match.winner as champion, title, startShow.
                  save new title reign as reignOut for new proxy. save new proxy
                get title out of titleChanges. add new reign to titleReigns. save title.
            else if there's a new title proxy but not a new title change, it's a defense and we only need the proxy
              find a title reign with the winners as champions. save to new proxy as reignIn
              save new proxy
              done
        */

        if (!newTitleReigns.has(match._id)) {
          var reigns = await TitleReign.find({
            $and: [
              { champion: { $in: match.winner[0] } },
              { title: { $eq: newReign.title } },
            ],
          });
          for (let reign of reigns) {
            if (
              JSON.stringify(reign.champion.sort()) ==
                JSON.stringify(match.winner.sort()) &&
              reign.endShow === undefined
            ) {
              newProxy.reignIn = reign._id;
              newProxy = await MatchTitleProxy.create(newProxy);
              match.title.push(newProxy._id);
              match = await Match.findByIdAndUpdate(match._id, match);
              break;
            }
          }
        } else {
          newReign = newTitleReigns.get(match._id);
          newReign.startShow = show._id;
          var reigns = await TitleReign.find({
            $and: [
              { champion: { $in: match.loser[0] } },
              { title: { $eq: newReign.title } },
            ],
          });
          for (let reign of reigns) {
            if (
              JSON.stringify(reign.champion.sort()) ==
                JSON.stringify(match.loser.sort()) &&
              reign.endShow === undefined
            ) {
              reign.endShow = show._id;
              await TitleReign.findByIdAndUpdate(reign._id, reign);

              break;
            }
          }
        }
      }
    }

    console.log(show._id);
    await rankingsController.calcRankings();
    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        show: show,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getLatestShow = async (req, res) => {
  try {
    const show = await Show.find()
      .populate({
        path: 'matches',
        model: Match,
        populate: {
          path: 'winner loser',
          model: Wrestler,
        },
      })
      .sort('-date');
    var latest = show[0];

    res.status(200).json({
      status: 'success',
      data: { latest },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
