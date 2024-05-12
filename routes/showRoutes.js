const express = require('express');
const showController = require('../controllers/showController');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(showController.getAllShows)
  .post(showController.createShow);
router
  .route('/:id')
  .get(showController.getShow)
  .patch(showController.updateShow)
  .delete(showController.deleteShow);

module.exports = router;
