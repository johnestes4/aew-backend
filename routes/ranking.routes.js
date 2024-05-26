const express = require('express');
const rankingsController = require('../controllers/rankings.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router.route('/').get(rankingsController.getRankings);
router
  .route('/calc')
  .post(authController.auth, rankingsController.calcRankings);

module.exports = router;
