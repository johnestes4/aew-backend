const express = require('express');
const matchController = require('../controllers/match.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(matchController.getAllMatches)
  .post(authController.auth, matchController.createMatch);
router
  .route('/:id')
  .get(matchController.getMatch)
  .patch(authController.auth, matchController.updateMatch)
  .delete(authController.auth, matchController.deleteMatch);

module.exports = router;
