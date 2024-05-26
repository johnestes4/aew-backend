const Show = require('../models/show');
const Match = require('../models/match');
const Wrestler = require('../models/wrestler');
const TitleReign = require('../models/titleReign');
const Title = require('../models/title');
const Team = require('../models/team');
const rankingsController = require('./rankings.controller');
const APIFeatures = require('../utils/apiFeatures');
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
    var show = req.body.show;
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
    // now the show has an id and we can do all the heavy lifting for titles
    // because of how it has to save repeatedly to get all the ids, i don't think i can test this with no db changes
    // i'll wait til after double or nothing and the title changes that will probably happen there
    // back up the whole DB, add the new show, and see if the champions properly update
    for (let match of newMatches) {
      match.show = show._id;
      if (newTitleReigns.has(match._id) || newTitleProxies.has(match._id)) {
        var newProxy = newTitleProxies.get(match._id);

        // if there's no new title reign, this is a DEFENSE and we only need a proxy
        if (!newTitleReigns.has(match._id)) {
          // find a title reign with a winner in common for the proper title
          var reigns = await TitleReign.find({
            $and: [
              { champion: { $in: match.winner[0] } },
              { title: { $eq: newProxy.title } },
            ],
          });
          // sift through found reigns to find a perfect match of champions with the proper title and no endShow
          for (let reign of reigns) {
            if (
              JSON.stringify(reign.champion.sort()) ==
                JSON.stringify(match.winner.sort()) &&
              reign.endShow === undefined
            ) {
              // set correct reign as reignIn for new proxy, then create it
              newProxy.reignIn = reign._id;
              newProxy = await MatchTitleProxy.create(newProxy);
              // link new proxy to match, then break
              match.title.push(newProxy._id);
              break;
            }
          }
        } else {
          // this means there IS a new title reign, which means a title change
          // title changes require changes to the existing title reign, a new title reign, changes to the title, and a new proxy
          newReign = newTitleReigns.get(match._id);
          newReign.startShow = show._id;
          // find a reign where the champions match the LOSER, as reflected in the newReign object
          var reigns = await TitleReign.find({
            $and: [
              { champion: { $in: newReign.loser[0] } },
              { title: { $eq: newReign.title } },
            ],
          });
          for (let reign of reigns) {
            // find the perfect match, same as above
            // (this should probably be a separate function that gets reused but i just need this to work right now)
            if (
              JSON.stringify(reign.champion.sort()) ==
                JSON.stringify(newReign.loser.sort()) &&
              reign.endShow === undefined
            ) {
              // set the current show as an endreign for the existing reign. save existing reign
              reign.endShow = show._id;
              reign = await TitleReign.findByIdAndUpdate(reign._id, reign);
              // set existing reign as reignIn on the proxy
              newProxy.reignIn = reign._id;
              //i'm not completely sure if deleting loser off newReign will remove it from the map, oe if it would be essential after using it once
              //honestly i'm pretty sure this is unnecessary
              //but i don't want to have to think it through any further right now so i'm playing it safe
              var newNewReign = {
                title: newReign.title,
                champion: newReign.champion,
                startShow: show._id,
              };
              newNewReign = await TitleReign.create(newNewReign);
              // get the title, add the new reign to its reign array, save changes
              var title = titleChanges.get(newNewReign.title);
              title.reigns.push(newNewReign._id);
              title = await Title.findByIdAndUpdate(title._id, title);
              // set new reign as reignout for the new proxy, save new proxy
              newProxy.reignOut = newNewReign._id;
              newProxy = await MatchTitleProxy.create(newProxy);
              // attach new proxy to match
              match.title.push(newProxy._id);
              break;
            }
          }
        }
      }
      // save the match. if there was a titleproxy created it should have that. if not it's just with show id added
      match = await Match.findByIdAndUpdate(match._id, match);
    }

    console.log(show._id);
    await rankingsController.calcRankings(req, res);
    // res.status(201).json({
    //   //status 201 means Created
    //   status: 'success',
    //   data: {
    //     show: show,
    //   },
    // });
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
