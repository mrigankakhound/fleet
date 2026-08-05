const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main',
      unique: true,
    },
    companyName: {
      type: String,
      default: 'Fleet Reminder Pro',
      maxlength: 100,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    reminderDays: {
      type: [Number],
      default: [30, 15, 7, 4, 2, 1, 0],
    },

    // ─── Telegram Configuration ───────────────────────────────────────────
    telegramBotToken: {
      type: String,
      default: '',
    },
    telegramChatId: {
      type: String,
      default: '',
    },
    telegramEnabled: {
      type: Boolean,
      default: false,
    },

    // ─── Email (SMTP) Configuration ───────────────────────────────────────
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPass: {
      type: String,
      default: '',
    },
    smtpFromEmail: {
      type: String,
      default: '',
    },
    smtpFromName: {
      type: String,
      default: 'Fleet Reminder Pro',
    },
    emailEnabled: {
      type: Boolean,
      default: false,
    },

    // ─── Message Template ─────────────────────────────────────────────────
    messageTemplate: {
      type: String,
      default:
        '🚗 Fleet Reminder Pro\n\nVehicle:\n{vehicleNumber}\n\nDocument:\n{documentType}\n\nExpires In:\n{days} days\n\nExpiry Date:\n{expiryDate}\n\nOwner:\n{ownerName}\n\nPlease renew before expiry.',
    },
    reminderCronTime: {
      type: String,
      default: '0 8 * * *', // 8:00 AM daily
    },

    // ─── Manager Configuration ────────────────────────────────────────────
    // All reminder notifications are sent exclusively to the manager.
    // Vehicle owners never receive automated messages.
    managerName: {
      type: String,
      default: '',
      maxlength: 100,
    },
    managerEmail: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
