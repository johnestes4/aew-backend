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
    allElite: {
      type: Boolean,
      default: false,
    },
    male: {
      type: Boolean,
      default: true,
    },
    power: {
      type: Number,
      default: 1000,
    },
    startPower: Number,
    powerHistory: [
      {
        date: Date,
        power: Number,
        place: Number,
      },
    ],
    boosts: [
      {
        //gotta make match/wrestler proxies for here, this can't just have a reference straight to matches - matches also reference wrestlers and it creates a loop

        startPower: Number,
        win: Number,
        //if it's a 1v1 (or the guy's generally competing alone) set this to 1
        //if it's a 2v2 tag, set to 2
        //if it's trios set it to 3
        sideSize: Number,
        showMod: Number,
        titleMod: Number,
        date: Date,
        match: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'match',
        },
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
    record: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wrestlermatchproxy',
      },
    ],
  },
  { usePushEach: true }
);

const Wrestler = mongoose.model('Wrestler', wrestlerSchema);
module.exports = Wrestler;
