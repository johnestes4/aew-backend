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
    //
    //subTeams would only activate on trios - attach the comboIDs for each two-man team that's part of the trio
    //then trios matches could also have a slight effect on the teams in them
    //ie - bullet club gold trio matches should give some amount of boost to the gunns
    //might help the issues right now in the tag division rankings
    subTeams: [String],
    power: Number,
    startPower: Number,
    powerHistory: [
      {
        date: Date,
        power: Number,
        place: Number,
      },
    ],
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
        sideSize: Number,
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
