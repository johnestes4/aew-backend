const MatchTitleProxy = require('../models/matchTitleProxy');
const APIFeatures = require('../utils/apiFeatures');

exports.getAllMatchTitleProxies = async (req, res) => {
  try {
    const features = new APIFeatures(MatchTitleProxy.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // await executes the query and returns all the documents
    const titleProxies = await features.query;

    res.status(200).json({
      status: 'success',
      results: titleProxies.length,
      data: {
        titleProxies,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getMatchTitleProxy = async (req, res) => {
  try {
    const matchTitleProxy = await MatchTitleProxy.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { matchTitleProxy },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createMatchTitleProxy = async (req, res) => {
  try {
    const newMatchTitleProxy = await MatchTitleProxy.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        matchTitleProxy: newMatchTitleProxy,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateMatchTitleProxy = async (req, res) => {
  try {
    const matchTitleProxy = await MatchTitleProxy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        //this third argument makes sure the new document is the one that gets returned
        new: true,
        //this validates the operation against the model's schema
        //presumably it helps stop invalid changes
        runValidators: true,
      }
    );
    res.status(200).json({
      status: 'success',
      data: { matchTitleProxy },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteMatchTitleProxy = async (req, res) => {
  try {
    await MatchTitleProxy.findByIdAndDelete(req.params.id);
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
