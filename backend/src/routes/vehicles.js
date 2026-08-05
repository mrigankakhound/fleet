const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle, renewDocument,
} = require('../controllers/vehicleController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authMiddleware);

const vehicleValidation = [
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required').toUpperCase(),
  body('insuranceExpiry').optional({ nullable: true }).isISO8601().withMessage('Invalid insurance expiry date'),
  body('pollutionExpiry').optional({ nullable: true }).isISO8601().withMessage('Invalid pollution expiry date'),
  body('gpsExpiry').optional({ nullable: true }).isISO8601().withMessage('Invalid GPS expiry date'),
];

router.get('/', getVehicles);
router.post('/', vehicleValidation, validate, createVehicle);
router.get('/:id', getVehicle);
router.put('/:id', vehicleValidation, validate, updateVehicle);
router.delete('/:id', deleteVehicle);
router.patch(
  '/:id/renew',
  [
    body('documentType').isIn(['insurance', 'pollution', 'gps']).withMessage('Invalid document type'),
    body('newExpiryDate').isISO8601().withMessage('Invalid expiry date'),
  ],
  validate,
  renewDocument
);

module.exports = router;
