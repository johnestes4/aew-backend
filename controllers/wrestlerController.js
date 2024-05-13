const Wrestler = require('./../models/wrestler');
const Match = require('./../models/match');
const TitleReign = require('./../models/titleReign');

const APIFeatures = require('./../utils/apiFeatures');

exports.getAllWrestlers = async (req, res) => {
  try {
    const features = new APIFeatures(Wrestler.find(), req.query)
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
    const features = new APIFeatures(Wrestler.find(), req.query)
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
    const wrestler = await Wrestler.findById(req.params.id);

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
