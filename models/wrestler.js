const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Team = require('./team');
const TitleReign = require('./titleReign');

const wrestlerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name required'],
      trim: true,
    },
    img: String,
    nickname: String,
    aliases: [String],
    male: {
      type: Boolean,
      default: true,
    },
    power: {
      type: Number,
      default: 1000,
    },
    moves: [String],
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'team',
    },
    faction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'team',
    },
    titles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'titlereign',
      },
    ],
    bio: String,
    active: Boolean,
    alumni: Boolean,
  },
  { usePushEach: true }
);

const Wrestler = mongoose.model('Wrestler', wrestlerSchema);
module.exports = Wrestler;
