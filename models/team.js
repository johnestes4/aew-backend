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
    //
    // i'm seeing this now for the first time in a while. i really should do this
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
        info: {
          string: String,
          result: String,
          time: String,
          date: Date,
        },
        startPower: Number,
        currentPower: Number,
        win: Number,
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

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
