const mongoose = require('mongoose');

const Title = require('./title');
const Match = require('./match');
const Wrestler = require('./wrestler');
const TitleReign = require('./titleReign');

const reignWrestlerProxySchema = new mongoose.Schema(
  {
    reign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'titleReign',
    },
    wrestler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'wrestler',
    },
  },
  { usePushEach: true }
);

reignWrestlerProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('Checking for valid foreign keys');
  TitleReign.findById(transaction.reign, function (err, found) {
    if (found) {
      Wrestler.findById(transaction.wrestler, function (err, found) {
        if (found) {
          return next();
        } else {
          return next(new Error('Wrestler not found'));
        }
      });
    } else {
      return next(new Error('Title Reign not found'));
    }
  });
});

reignWrestlerProxySchema.pre('save', function (next, done) {
  var transaction = this;
  console.log('inserting other half of foreign keys');

  var titleReign = TitleReign.findByIdAndUpdate(
    transaction.reign,
    {
      $addToSet: { reignWrestlerProxies: this._id },
    },
    { safe: true, upsert: true },
    function (err, model) {
      console.log(err);
      console.log('Title Reign updated');
    }
  );

  var wrestler = Wrestler.findByIdAndUpdate(
    transaction.wrestler,
    {
      $addToSet: { reignWrestlerProxies: this._id },
    },
    { safe: true, upsert: true },
    function (err, model) {
      console.log(err);
      console.log('Wrestler updated');
    }
  );

  next();
});

const reignWrestlerProxy = mongoose.model(
  'ReignWrestlerProxy',
  reignWrestlerProxySchema
);
module.exports = reignWrestlerProxy;
