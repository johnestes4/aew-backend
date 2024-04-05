const Show = require('./../models/show');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAllShows = async (req, res) => {
  try {
    const features = new APIFeatures(Show.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
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
    const show = await Show.findById(req.params.id);

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
