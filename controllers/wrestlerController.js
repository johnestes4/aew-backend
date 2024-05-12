const Wrestler = require('./../models/wrestler');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAllWrestlers = async (req, res) => {
  try {
    const features = new APIFeatures(Wrestler.find(), req.query)
      .filter()
      .sort()
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
    const features = new APIFeatures(Wrestler.find(), req.query)
      .filter()
      .sort('-power')
      .limitFields('name,aliases');
    // await executes the query and returns all the documents
    const wrestlers = await features.query;

    var wresMap = new Map();
    for (let wres of wrestlers) {
      if (wrestler.aliases.length < 1) {
        continue;
      }
      for (let a of wrestler.aliases) {
        wresMap.set(a, wres._id);
      }
    }

    res.status(201).json({
      status: 'success',
      data: 'Check the DB to see how successful it was!',
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
