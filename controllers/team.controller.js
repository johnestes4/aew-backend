const Team = require('../models/team');
const Wrestler = require('../models/wrestler');
const Match = require('../models/match');

const APIFeatures = require('../utils/apiFeatures');

exports.male = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.male = { $eq: 'true' };
  next();
};
exports.female = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.male = { $eq: false };
  next();
};
exports.tag = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.wrestlers = { $size: 2 };
  next();
};
exports.trio = (req, res, next) => {
  //this alias middleware sends out a preset query, and is attached to a specific API call
  req.query.wrestlers = { $size: 3 };
  next();
};

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
exports.getTeamRankings = async (req, res) => {
  try {
    const features = new APIFeatures(Team.find({ active: 'true' }), req.query)
      .filter()
      .sort('-power')
      .limitFields('name,power,male');
    // await executes the query and returns all the documents
    const team = await features.query;

    var teamOut = [];
    res.status(200).json({
      status: 'success',
      results: team.length,
      data: {
        team,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTeamByComboID = async (req, res) => {
  try {
    // console.log(req.body.comboID);
    const team = await Team.findOne({ comboID: req.body.comboID });
    // console.log(team.name);

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
