const express = require('express');
const router = express.Router();
const { exportVehicles } = require('../controllers/exportController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/vehicles', exportVehicles);

module.exports = router;
