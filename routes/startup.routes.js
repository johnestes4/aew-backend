const express = require('express');
const startupController = require('../controllers/startup.controller');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// router.route('/engage').get(startupController.importData);

module.exports = router;
