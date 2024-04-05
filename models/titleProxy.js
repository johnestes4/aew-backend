const mongoose = require('mongoose');

const Title = require('./title');
const Match = require('./match');
const TitleReign = require('./titleReign');

const titleProxySchema = new mongoose.Schema(
  {
    title: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'title',
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'match',
    },
    reignIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'titleReign',
    },
    reignOut: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'titleReign',
    },
  },
  { usePushEach: true }
);

const titleProxy = mongoose.model('titleProxy', titleProxySchema);
module.exports = titleProxy;
