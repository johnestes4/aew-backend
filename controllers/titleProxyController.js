const TitleProxy = require('./../models/titleProxy');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAllTitleProxies = async (req, res) => {
  try {
    const features = new APIFeatures(TitleProxy.find(), req.query)
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

exports.getTitleProxy = async (req, res) => {
  try {
    const titleProxy = await TitleProxy.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: { titleProxy },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTitleProxy = async (req, res) => {
  try {
    const newTitleProxy = await TitleProxy.create(req.body);

    res.status(201).json({
      //status 201 means Created
      status: 'success',
      data: {
        titleProxy: newTitleProxy,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTitleProxy = async (req, res) => {
  try {
    const titleProxy = await TitleProxy.findByIdAndUpdate(
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
      data: { titleProxy },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTitleProxy = async (req, res) => {
  try {
    await TitleProxy.findByIdAndDelete(req.params.id);
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
