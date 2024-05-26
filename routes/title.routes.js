const express = require('express');
const titleController = require('../controllers/title.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(titleController.getAllTitles)
  .post(authController.auth, titleController.createTitle);
router
  .route('/:id')
  .get(titleController.getTitle)
  .patch(authController.auth, titleController.updateTitle)
  .delete(authController.auth, titleController.deleteTitle);

module.exports = router;
