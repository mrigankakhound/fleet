const mongoose = require('mongoose');

// Counter model for sequential IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: Number,
      unique: true,
    },
    vehicleName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 20,
    },
    ownerName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    driverName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      maxlength: 15,
      default: '',
    },
    insuranceExpiry: {
      type: Date,
      default: null,
    },
    pollutionExpiry: {
      type: Date,
      default: null,
    },
    gpsExpiry: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 500,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-increment vehicleId before saving
// Mongoose 9: async pre-hooks must NOT call next() — just return/throw
vehicleSchema.pre('save', async function () {
  if (!this.isNew) return;
  const counter = await Counter.findByIdAndUpdate(
    'vehicleId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.vehicleId = counter.seq;
});

// Indexes for fast search
// Note: vehicleId index is already created by unique:true — no duplicate needed
vehicleSchema.index({ vehicleNumber: 'text', ownerName: 'text', driverName: 'text' });
vehicleSchema.index({ whatsappNumber: 1 });
vehicleSchema.index({ insuranceExpiry: 1 });
vehicleSchema.index({ pollutionExpiry: 1 });
vehicleSchema.index({ gpsExpiry: 1 });
vehicleSchema.index({ isActive: 1 });

module.exports = { Vehicle: mongoose.model('Vehicle', vehicleSchema), Counter };
