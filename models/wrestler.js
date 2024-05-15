const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Team = require('./team');
const Match = require('./match');
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
    startPower: Number,
    boosts: [
      {
        //gotta make match/wrestler proxies for here, this can't just have a reference straight to matches - matches also reference wrestlers and it creates a loop

        startPower: Number,
        win: Number,
        showMod: Number,
        titleMod: Number,
        date: Date,
      },
    ],
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
    active: {
      type: Boolean,
      default: true,
    },
    alumni: Boolean,
    profileImage: String,
  },
  { usePushEach: true }
);

const Wrestler = mongoose.model('Wrestler', wrestlerSchema);
module.exports = Wrestler;
