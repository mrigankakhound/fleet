const { Vehicle } = require('../models/Vehicle');
const ActivityLog = require('../models/ActivityLog');
const ReminderLog = require('../models/ReminderLog');

// Helper: build date filter
const buildDateQuery = (field, from, to) => {
  const query = {};
  if (from || to) {
    query[field] = {};
    if (from) query[field].$gte = new Date(from);
    if (to) query[field].$lte = new Date(to);
  }
  return query;
};

// GET /api/vehicles
const getVehicles = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = '',
      status = '', // expired, expiring7, expiring30, valid
      sortBy = 'vehicleId',
      sortOrder = 'asc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Collect filters separately and combine with $and to prevent $or conflicts
    const conditions = [{ isActive: true }];

    // Search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const vehicleIdNum = parseInt(search);
      const idQuery = !isNaN(vehicleIdNum) ? [{ vehicleId: vehicleIdNum }] : [];
      conditions.push({
        $or: [
          { vehicleNumber: searchRegex },
          { ownerName: searchRegex },
          { driverName: searchRegex },
          { whatsappNumber: searchRegex },
          ...idQuery,
        ],
      });
    }

    // Status filter (independent of search)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    if (status === 'expired') {
      conditions.push({
        $or: [
          { insuranceExpiry: { $lt: today } },
          { pollutionExpiry: { $lt: today } },
          { gpsExpiry: { $lt: today } },
        ],
      });
    } else if (status === 'expiring7') {
      conditions.push({
        $or: [
          { insuranceExpiry: { $gte: today, $lte: in7Days } },
          { pollutionExpiry: { $gte: today, $lte: in7Days } },
          { gpsExpiry: { $gte: today, $lte: in7Days } },
        ],
      });
    } else if (status === 'expiring30') {
      conditions.push({
        $or: [
          { insuranceExpiry: { $gte: today, $lte: in30Days } },
          { pollutionExpiry: { $gte: today, $lte: in30Days } },
          { gpsExpiry: { $gte: today, $lte: in30Days } },
        ],
      });
    }

    // Build final query — use $and when multiple conditions exist
    const matchQuery = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(matchQuery).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Vehicle.countDocuments(matchQuery),
    ]);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/vehicles
const createVehicle = async (req, res, next) => {
  try {
    const { vehicleName, vehicleNumber, ownerName, driverName, whatsappNumber, insuranceExpiry, pollutionExpiry, gpsExpiry, notes } = req.body;

    const vehicle = await Vehicle.create({
      vehicleName,
      vehicleNumber,
      ownerName,
      driverName,
      whatsappNumber,
      insuranceExpiry: insuranceExpiry || null,
      pollutionExpiry: pollutionExpiry || null,
      gpsExpiry: gpsExpiry || null,
      notes,
    });

    await ActivityLog.create({
      action: 'vehicle_added',
      vehicleId: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      details: `Vehicle ${vehicle.vehicleNumber} added by ${req.user?.username || 'admin'}`,
      performedBy: req.user?.username || 'admin',
    });

    res.status(201).json({ success: true, message: 'Vehicle added successfully.', data: vehicle });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/:id
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();
    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // Fetch reminder history
    const reminderHistory = await ReminderLog.find({ vehicleId: vehicle._id })
      .sort({ sentAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data: { ...vehicle, reminderHistory } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res, next) => {
  try {
    const { vehicleName, vehicleNumber, ownerName, driverName, whatsappNumber, insuranceExpiry, pollutionExpiry, gpsExpiry, notes } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { vehicleName, vehicleNumber, ownerName, driverName, whatsappNumber, insuranceExpiry, pollutionExpiry, gpsExpiry, notes },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    await ActivityLog.create({
      action: 'vehicle_updated',
      vehicleId: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      details: `Vehicle ${vehicle.vehicleNumber} updated`,
      performedBy: req.user?.username || 'admin',
    });

    res.json({ success: true, message: 'Vehicle updated successfully.', data: vehicle });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vehicles/:id
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    await ActivityLog.create({
      action: 'vehicle_deleted',
      vehicleId: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      details: `Vehicle ${vehicle.vehicleNumber} deleted`,
      performedBy: req.user?.username || 'admin',
    });

    res.json({ success: true, message: 'Vehicle deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/vehicles/:id/renew
const renewDocument = async (req, res, next) => {
  try {
    const { documentType, newExpiryDate } = req.body;
    const validTypes = ['insurance', 'pollution', 'gps'];

    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ success: false, message: 'Invalid document type.' });
    }
    if (!newExpiryDate) {
      return res.status(400).json({ success: false, message: 'New expiry date is required.' });
    }

    const fieldMap = {
      insurance: 'insuranceExpiry',
      pollution: 'pollutionExpiry',
      gps: 'gpsExpiry',
    };

    const actionMap = {
      insurance: 'insurance_renewed',
      pollution: 'pollution_renewed',
      gps: 'gps_renewed',
    };

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { [fieldMap[documentType]]: new Date(newExpiryDate) },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    await ActivityLog.create({
      action: actionMap[documentType],
      vehicleId: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      details: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} renewed until ${new Date(newExpiryDate).toDateString()}`,
      performedBy: req.user?.username || 'admin',
    });

    res.json({ success: true, message: `${documentType} renewed successfully.`, data: vehicle });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle, renewDocument };
