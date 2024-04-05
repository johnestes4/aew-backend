const mongoose = require('mongoose');
const Match = require('./match');

const showSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Show must have name'],
      trim: true,
    },
    specialName: {
      //things like Winter Is Coming, Fyter Fest, etc special show names. would have to add them all manually later but fuck it i shoulda stored them while scraping
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Show must have date'],
    },
    location: String,
    ppv: Boolean,
    matches: [
      //DOES this need a proxy? probably not, try it out just like this
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
      },
    ],
    links: [String],
    notes: String,
  },
  { usePushEach: true }
);

const Show = mongoose.model('Show', showSchema);
module.exports = Show;
