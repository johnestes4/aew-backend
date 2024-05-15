const mongoose = require('mongoose');
// const TitleReign = require('./titleReign');
// const Wrestler = require('./wrestler');
// const Team = require('./team');

const titleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Title must have name'],
      trim: true,
    },
    currentChampion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wrestler',
      },
    ],
    currentChampionTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    promotion: String,
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
