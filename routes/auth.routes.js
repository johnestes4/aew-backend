const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.route('/').post(authController.login);

module.exports = router;
