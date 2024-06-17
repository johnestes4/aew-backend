const express = require('express');
const utilityController = require('../controllers/utility.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router
  .route('/quicktitleupdate')
  .post(authController.auth, utilityController.quickTitleUpdate);
router
  .route('/scanteams')
  .post(authController.auth, utilityController.scanTeams);
router
  .route('/cleanaliases')
  .post(authController.auth, utilityController.cleanAliases);
router
  .route('/attachtitles')
  .post(authController.auth, utilityController.attachTitles);
router
  .route('/attachmatches')
  .post(authController.auth, utilityController.attachMatches);
router
  .route('/cleantagmatches')
  .post(authController.auth, utilityController.cleanTagMatches);
router
  .route('/attachimages')
  .post(authController.auth, utilityController.attachImages);
router
  .route('/comboids')
  .post(authController.auth, utilityController.generateTeamComboIDs);
router
  .route('/attachtitleteams')
  .post(authController.auth, utilityController.attachTitleTeams);
router
  .route('/teamstartpower')
  .post(authController.auth, utilityController.teamPower);

module.exports = router;
