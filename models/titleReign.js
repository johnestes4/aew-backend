const mongoose = require('mongoose');

//this goes on WRESTLER and TITLE

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
    endOutside: Boolean,

    //is this how we want to do it????????????
    //i think so, we want to reference that info. just weird.
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
