const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: ['insurance', 'pollution', 'gps'],
      required: true,
    },
    reminderDays: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'mock'],
      default: 'sent',
    },
    whatsappNumber: {
      type: String,
    },
    messageContent: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

reminderLogSchema.index({ vehicleId: 1, documentType: 1, reminderDays: 1, sentAt: 1 });
reminderLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
