const TitleReign = require('../models/titleReign');
const Title = require('./../models/title');
const Show = require('./../models/show');
const Wrestler = require('./../models/wrestler');
const Team = require('./../models/team');

const APIFeatures = require('./../utils/apiFeatures');

exports.getAllTitles = async (req, res) => {
  try {
    const features = new APIFeatures(
      Title.find()
        .populate({
          path: 'currentChampion',
          model: Wrestler,
        })
        .populate({
          path: 'currentChampionTeam',
          model: Team,
        }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // await executes the query and returns all the documents
    const titles = await features.query;

    res.status(200).json({
      status: 'success',
      results: titles.length,
      data: {
        titles,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTitle = async (req, res) => {
  try {
    const title = await Title.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { title },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTitle = async (req, res) => {
  try {
    const newTitle = await Title.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        title: newTitle,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTitle = async (req, res) => {
  try {
    const title = await Title.findByIdAndUpdate(req.params.id, req.body, {
      //this third argument makes sure the new document is the one that gets returned
      new: true,
      //this validates the operation against the model's schema
      //presumably it helps stop invalid changes
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: { title },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTitle = async (req, res) => {
  try {
    await Title.findByIdAndDelete(req.params.id);
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
