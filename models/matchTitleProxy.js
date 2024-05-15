const mongoose = require('mongoose');

const Title = require('./title');
const Match = require('./match');
const TitleReign = require('./titleReign');

//this one goes on MATCH and connects it to a TITLE
//used to track whether said match was the beginning or end of a reign, which title it connects to, etc
//right now the title field on matches is just a string. gonna have to replace those with these
//the match ids should already correspond at least

const matchTitleProxySchema = new mongoose.Schema(
  {
    title: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'title',
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'match',
    },
    reignIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'titleReign',
    },
    reignOut: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'titleReign',
    },
  },
  { usePushEach: true }
);

//if there's a reignout, you know it's a titlechange
//reignin and no reignout: defense
//determine champion by reign.champion

matchTitleProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('Checking for valid foreign keys');
  Match.findById(transaction.match, function (err, found) {
    if (found) {
      Title.findById(transaction.title, function (err, found) {
        if (found) {
          return next();
        } else {
          return next(new Error('Title not found'));
        }
      });
    } else {
      return next(new Error('Match not found'));
    }
  });
});

matchTitleProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('inserting other half of foreign keys');

  var match = Match.findByIdAndUpdate(
    transaction.match,
    {
      $addToSet: { matchTitleProxies: this._id },
    },
    { safe: true, upsert: true },
    function (err, model) {
      console.log(err);
      console.log('Match updated');
    }
  );

  var title = Title.findByIdAndUpdate(
    transaction.title,
    {
      $addToSet: { matchTitleProxies: this._id },
    },
    { safe: true, upsert: true },
    function (err, model) {
      console.log(err);
      console.log('Title updated');
    }
  );

  next();
});

const matchTitleProxy = mongoose.model(
  'MatchTitleProxy',
  matchTitleProxySchema
);
module.exports = matchTitleProxy;
