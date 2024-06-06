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
    forbiddenDoor: {
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
        info: {
          string: String,
          result: String,
          time: String,
          date: Date,
        },
        startPower: Number,
        win: Number,
        //if it's a 1v1 (or the guy's generally competing alone) set this to 1
        //if it's a 2v2 tag, set to 2
        //if it's trios set it to 3
        sideSize: Number,
        showMod: Number,
        titleMod: Number,
        match: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'match',
        },
        show: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'show',
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
    record: {
      overallWins: Number,
      overallLosses: Number,
      overallDraws: Number,
      singlesWins: Number,
      singlesLosses: Number,
      singlesDraws: Number,
      tagWins: Number,
      tagLosses: Number,
      tagDraws: Number,
      trioWins: Number,
      trioLosses: Number,
      trioDraws: Number,
    },
    recordYear: {
      overallWins: Number,
      overallLosses: Number,
      overallDraws: Number,
      singlesWins: Number,
      singlesLosses: Number,
      singlesDraws: Number,
      tagWins: Number,
      tagLosses: Number,
      tagDraws: Number,
      trioWins: Number,
      trioLosses: Number,
      trioDraws: Number,
    },
    streak: Number,
    streakFact: {
      wins: Number,
      overall: Number,
    },
  },
  { usePushEach: true }
);

const Wrestler = mongoose.model('Wrestler', wrestlerSchema);
module.exports = Wrestler;
