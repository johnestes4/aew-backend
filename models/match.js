const mongoose = require('mongoose');
const Wrestler = require('./wrestler');
const Show = require('./show');
const TitleProxy = require('./titleProxy');

const matchSchema = new mongoose.Schema(
  {
    winner: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wrestler',
      },
    ],
    result: {
      type: String,
      trim: true,
    },
    loser: [
      [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'wrestler',
        },
      ],
    ],
    time: String,
    matchType: String,
    title: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'titleProxy',
      },
    ], //replace with titleProxy
    mainEvent: Boolean, //good for power calc, main events weighted slightly higher
    preshow: Boolean,
    show: {
      //show/match shouldn't need a proxy. there's only a few fields on show, and all are useful for power calc
      //except location, maybe, but it's one string man it isn't worth skipping
      type: mongoose.Schema.Types.ObjectId,
      ref: 'show',
    },
    notes: String, //keep a notes field on everything for future use - probably worth having
  },
  { usePushEach: true }
);

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
