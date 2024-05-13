const express = require('express');
const teamController = require('../controllers/teamController');

const Title = require('../models/title');
const Team = require('../models/team');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router
  .route('/')
  .get(teamController.getAllTeams)
  .post(teamController.createTeam);
router.route('/calc').get(teamController.scanTeams);
router
  .route('/:id')
  .get(teamController.getTeam)
  .patch(teamController.updateTeam)
  .delete(teamController.deleteTeam);

module.exports = router;
