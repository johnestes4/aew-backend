const mongoose = require('mongoose');
const Wrestler = require('./wrestler');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team must have name'],
      trim: true,
    },
    wrestlers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'wrestler',
    },
    power: Number,
    faction: Boolean,
    active: Boolean,
  },
  { usePushEach: true }
);

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
