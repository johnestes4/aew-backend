const express = require('express');
const titleReignController = require('../controllers/titleReign.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(titleReignController.getAllTitleReigns)
  .post(authController.auth, titleReignController.createTitleReign);
router
  .route('/:id')
  .get(titleReignController.getTitleReign)
  .patch(authController.auth, titleReignController.updateTitleReign)
  .delete(authController.auth, titleReignController.deleteTitleReign);

module.exports = router;
