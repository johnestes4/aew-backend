const express = require('express');
const showController = require('../controllers/show.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router.route('/new').post(showController.newShow);
router
  .route('/')
  .get(showController.getAllShows)
  .post(authController.auth, showController.createShow);
router;
router
  .route('/:id')
  .get(showController.getShow)
  .patch(authController.auth, showController.updateShow)
  .delete(authController.auth, showController.deleteShow);

module.exports = router;
