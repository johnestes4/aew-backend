const mongoose = require('mongoose');
const TitleReign = require('./titleReign');

const titleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Title must have name'],
      trim: true,
    },
    reigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'titleReign',
      },
    ],
  },
  { usePushEach: true }
);

const Title = mongoose.model('Title', titleSchema);
module.exports = Title;
