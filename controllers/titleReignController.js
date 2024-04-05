const TitleReign = require('./../models/titleReign');
const APIFeatures = require('./../utils/apiFeatures');
const Title = require('./../models/title');
const Wrestler = require('./../models/wrestler');
const Show = require('./../models/show');
const Match = require('./../models/match');

exports.getAllTitleReigns = async (req, res) => {
  try {
    const features = new APIFeatures(
      TitleReign.find()
        .populate({ path: 'title', model: Title })
        .populate({ path: 'champion', model: Wrestler })
        .populate({ path: 'startShow', model: Show })
        .populate({ path: 'endShow', model: Show })
        .populate({ path: 'defenses', model: Match }),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // await executes the query and returns all the documents
    const titleReigns = await features.query;

    res.status(200).json({
      status: 'success',
      results: titleReigns.length,
      data: {
        titleReigns,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTitleReign = async (req, res) => {
  try {
    const titleReign = await TitleReign.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { titleReign },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTitleReign = async (req, res) => {
  try {
    const newTitleReign = await TitleReign.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        titleReign: newTitleReign,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTitleReign = async (req, res) => {
  try {
    const titleReign = await TitleReign.findByIdAndUpdate(
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
      data: { titleReign },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTitleReign = async (req, res) => {
  try {
    await TitleReign.findByIdAndDelete(req.params.id);
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
