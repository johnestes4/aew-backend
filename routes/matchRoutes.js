const express = require('express');
const matchController = require('../controllers/matchController');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(matchController.getAllMatches)
  .post(matchController.createMatch);
router.route('/attach').get(matchController.attachMatches);
router
  .route('/:id')
  .get(matchController.getMatch)
  .patch(matchController.updateMatch)
  .delete(matchController.deleteMatch);

module.exports = router;
