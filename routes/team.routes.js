const express = require('express');
const teamController = require('../controllers/team.controller');
const authController = require('../controllers/auth.controller');

const Title = require('../models/title');
const Team = require('../models/team');
const Show = require('../models/show');
const Match = require('../models/match');

const router = express.Router();

router.route('/rankings').get(teamController.getTeamRankings);
router
  .route('/rankings/male')
  .get(teamController.male, teamController.tag, teamController.getTeamRankings);
router
  .route('/rankings/female')
  .get(
    teamController.female,
    teamController.tag,
    teamController.getTeamRankings
  );

router
  .route('/rankings/trio')
  .get(
    teamController.male,
    teamController.trio,
    teamController.getTeamRankings
  );
router;

router.route('/comboid').post(teamController.getTeamByComboID);

router
  .route('/')
  .get(teamController.getAllTeams)
  .post(authController.auth, teamController.createTeam);
router
  .route('/:id')
  .get(teamController.getTeam)
  .patch(authController.auth, teamController.updateTeam)
  .delete(authController.auth, teamController.deleteTeam);

module.exports = router;
