const Show = require('./../models/show');
const Match = require('./../models/match');
const Wrestler = require('./../models/wrestler');
const rankingsController = require('./rankingsController');
const APIFeatures = require('./../utils/apiFeatures');

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
      .sort('date')
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
        newWres = await Wrestler.create(newWres);
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
      var newMatch = await Match.create(match);
      newMatches.push(newMatch);
      show.matches[i] = newMatch._id;
    }
    delete show._id;
    show = await Show.create(show);
    for (let match of newMatches) {
      match.show = show._id;
      await Match.findByIdAndUpdate(match._id, match);
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
