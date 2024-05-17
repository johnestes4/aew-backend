const mongoose = require('mongoose');

const Title = require('./title');
const Wrestler = require('./wrestler');
const Team = require('./team');
const Match = require('./match');
const TitleReign = require('./titleReign');

// this attaches to wrestlers and is essentially their win/loss record
const wrestlerMatchProxySchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'match',
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'show',
    },
    date: Date,
    winnerString: String,
    loserString: String,
    wrestlers: [
      {
        name: String,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'wrestler',
        },
        won: Boolean,
      },
    ],
    teams: [
      {
        name: String,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'team',
        },
        won: Boolean,
      },
    ],
    titles: [
      {
        name: String,
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'title',
        },
      },
    ],
    matchType: String,
    resultType: String, // resulttype is pin/sub/dq, also draw/no contest
    img: String,
    link: String,
  },
  { usePushEach: true }
);

wrestlerMatchProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('Checking for valid foreign keys');
  for (let w of transaction.wrestlers) {
    Wrestler.findById(w, function (err, found) {
      if (found) {
        return next();
      } else {
        return next(new Error('Wrestler not found'));
      }
    });
  }
});

wrestlerMatchProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('inserting other half of foreign keys');
  var wrestler = Wrestler.findByIdAndUpdate(
    transaction.match,
    {
      $addToSet: { record: this._id },
    },
    { safe: true, upsert: true },
    function (err, model) {
      console.log(err);
      console.log('Wrestler updated');
    }
  );

  next();
});

const wrestlerMatchProxy = mongoose.model(
  'WrestlerMatchProxy',
  wrestlerMatchProxySchema
);
module.exports = wrestlerMatchProxy;
