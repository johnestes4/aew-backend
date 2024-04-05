const express = require('express');
const startupController = require('./../controllers/startupController');

const router = express.Router();

router.route('/engage').get(startupController.importData);

module.exports = router;
