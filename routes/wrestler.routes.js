const express = require('express');
const wrestlerController = require('../controllers/wrestler.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router.route('/rankings').get(wrestlerController.getWrestlerRankings);
router
  .route('/rankings/male')
  .get(wrestlerController.male, wrestlerController.getWrestlerRankings);
router
  .route('/rankings/female')
  .get(wrestlerController.female, wrestlerController.getWrestlerRankings);
router.route('/record/:id').get(wrestlerController.generateRecord);
router
  .route('/')
  .get(wrestlerController.getAllWrestlers)
  .post(authController.auth, wrestlerController.createWrestler);
router
  .route('/:id')
  .get(authController.auth, wrestlerController.getWrestler)
  .patch(authController.auth, wrestlerController.updateWrestler)
  .delete(authController.auth, wrestlerController.deleteWrestler);

module.exports = router;
