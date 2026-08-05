const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'vehicle_added',
        'vehicle_updated',
        'vehicle_deleted',
        'insurance_renewed',
        'pollution_renewed',
        'gps_renewed',
        'reminder_sent',
        'settings_updated',
        'admin_login',
        'admin_logout',
        'backup_created',
      ],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ vehicleId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
