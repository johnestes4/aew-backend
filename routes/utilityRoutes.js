const express = require('express');
const utilityController = require('../controllers/utilityController');

const router = express.Router();

router.route('/quicktitleupdate').get(utilityController.quickTitleUpdate);
router.route('/scanteams').get(utilityController.scanTeams);
router.route('/cleanaliases').get(utilityController.cleanAliases);
router.route('/attachtitles').get(utilityController.attachTitles);
router.route('/attachmatches').get(utilityController.attachMatches);
router.route('/cleantagmatches').get(utilityController.cleanTagMatches);
router.route('/attachimages').get(utilityController.attachImages);
router.route('/comboids').get(utilityController.generateTeamComboIDs);
router.route('/attachtitleteams').get(utilityController.attachTitleTeams);

module.exports = router;
