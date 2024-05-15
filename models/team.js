const mongoose = require('mongoose');
const Wrestler = require('./wrestler');
const Match = require('./match');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team must have name'],
      trim: true,
    },
    wrestlers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wrestler',
      },
    ],
    //comboID should be a json.stringified version of a sorted version of an array of the wrestler ids. this can then be used to search for a specific combination
    //first: make array JUST OF THE IDs. probably .toString() versions
    //JSON.stringify(wresArray.sort())
    comboID: { type: String, unique: true },
    power: Number,
    startPower: Number,
    faction: Boolean,
    active: Boolean,
    male: {
      type: Boolean,
      default: true,
    },
    boosts: [
      {
        startPower: Number,
        win: Number,
        showMod: Number,
        titleMod: Number,
        date: Date,
      },
    ],
  },
  { usePushEach: true }
);

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
