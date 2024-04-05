const express = require('express');
const titleReignController = require('../controllers/titleReignController');

const Title = require('./../models/title');
const Wrestler = require('./../models/wrestler');
const Show = require('./../models/show');
const Match = require('./../models/match');

const router = express.Router();

router
  .route('/')
  .get(titleReignController.getAllTitleReigns)
  .post(titleReignController.createTitleReign);
router
  .route('/:id')
  .get(titleReignController.getTitleReign)
  .patch(titleReignController.updateTitleReign)
  .delete(titleReignController.deleteTitleReign);

module.exports = router;
