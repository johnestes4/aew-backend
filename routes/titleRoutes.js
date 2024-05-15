const express = require('express');
const titleController = require('../controllers/titleController');

const Title = require('../models/title');
const Wrestler = require('../models/wrestler');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(titleController.getAllTitles)
  .post(titleController.createTitle);
router
  .route('/:id')
  .get(titleController.getTitle)
  .patch(titleController.updateTitle)
  .delete(titleController.deleteTitle);

module.exports = router;
