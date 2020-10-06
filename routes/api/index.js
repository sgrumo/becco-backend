const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/matches', require('./matches'));

module.exports = router;