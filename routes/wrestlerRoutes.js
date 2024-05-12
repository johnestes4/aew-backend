const express = require('express');
const wrestlerController = require('../controllers/wrestlerController');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(wrestlerController.getAllWrestlers)
  .post(wrestlerController.createWrestler);
router.route('/rankings').get(wrestlerController.getWrestlerRankings);
router
  .route('/:id')
  .get(wrestlerController.getWrestler)
  .patch(wrestlerController.updateWrestler)
  .delete(wrestlerController.deleteWrestler);

module.exports = router;
