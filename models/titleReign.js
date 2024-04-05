const mongoose = require('mongoose');

const titleReignSchema = new mongoose.Schema(
  {
    title: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'title',
    },
    champion: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'wrestler',
      },
    ],
    startShow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'show',
    },
    endShow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'show',
    },
    defenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
      },
    ],
  },
  { usePushEach: true }
);

const TitleReign = mongoose.model('TitleReign', titleReignSchema);
module.exports = TitleReign;
