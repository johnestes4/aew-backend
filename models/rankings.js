const mongoose = require('mongoose');
const Wrestler = require('./wrestler');

const rankingSchema = new mongoose.Schema(
  [
    {
      wrestler: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wrestler',
      },
    },
  ],
  { usePushEach: true }
);

const Rankings = mongoose.model('Rankings', rankingSchema);
module.exports = Title;
