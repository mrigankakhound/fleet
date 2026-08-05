const { Vehicle } = require('../models/Vehicle');
const ReminderLog = require('../models/ReminderLog');
const ActivityLog = require('../models/ActivityLog');

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDayOffset = (days) => {
  const d = getToday();
  d.setDate(d.getDate() + days);
  return d;
};

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const today = getToday();
    const tomorrow = getDayOffset(1);
    const in7Days = getDayOffset(7);

    const docFields = ['insuranceExpiry', 'pollutionExpiry', 'gpsExpiry'];

    const totalVehicles = await Vehicle.countDocuments({ isActive: true });

    // Count expired docs
    let expiredCount = 0;
    let expiringTodayCount = 0;
    let expiring7Count = 0;
    let activeDocCount = 0;
    let renewedTodayCount = 0;

    const vehicles = await Vehicle.find({ isActive: true }).lean();

    vehicles.forEach((v) => {
      docFields.forEach((field) => {
        const expiry = v[field];
        if (!expiry) return;
        if (expiry < today) {
          expiredCount++;
        } else {
          activeDocCount++;
          if (expiry >= today && expiry < tomorrow) {
            expiringTodayCount++;
          } else if (expiry >= today && expiry < in7Days) {
            expiring7Count++;
          }
        }
      });
    });

    // Reminders sent today
    const remindersTodayCount = await ReminderLog.countDocuments({
      sentAt: { $gte: today },
    });

    // Documents renewed today (from activity logs)
    renewedTodayCount = await ActivityLog.countDocuments({
      action: { $in: ['insurance_renewed', 'pollution_renewed', 'gps_renewed'] },
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        totalVehicles,
        activeDocuments: activeDocCount,
        expiredDocuments: expiredCount,
        expiringToday: expiringTodayCount,
        expiring7Days: expiring7Count,
        remindersSentToday: remindersTodayCount,
        renewedToday: renewedTodayCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/today
const getTodayWidget = async (req, res, next) => {
  try {
    const today = getToday();
    const tomorrow = getDayOffset(1);

    const vehicles = await Vehicle.find({ isActive: true }).lean();

    let insurance = 0, pollution = 0, gps = 0;

    vehicles.forEach((v) => {
      if (v.insuranceExpiry >= today && v.insuranceExpiry < tomorrow) insurance++;
      if (v.pollutionExpiry >= today && v.pollutionExpiry < tomorrow) pollution++;
      if (v.gpsExpiry >= today && v.gpsExpiry < tomorrow) gps++;
    });

    res.json({
      success: true,
      data: { insurance, pollution, gps, total: insurance + pollution + gps },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/calendar?month=7&year=2026
const getCalendar = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const vehicles = await Vehicle.find({
      isActive: true,
      $or: [
        { insuranceExpiry: { $gte: startDate, $lte: endDate } },
        { pollutionExpiry: { $gte: startDate, $lte: endDate } },
        { gpsExpiry: { $gte: startDate, $lte: endDate } },
      ],
    }).lean();

    // Build date map
    const dateMap = {};
    const today = getToday();

    const addToDate = (date, vehicleNumber, docType) => {
      if (!date) return;
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dateMap[key]) {
        dateMap[key] = { date: key, items: [], status: 'valid' };
      }
      const daysLeft = Math.floor((d - today) / (1000 * 60 * 60 * 24));
      let itemStatus = 'valid';
      if (daysLeft < 0) itemStatus = 'expired';
      else if (daysLeft <= 7) itemStatus = 'expiring';

      dateMap[key].items.push({ vehicleNumber, docType, daysLeft, status: itemStatus });

      // Update day status (worst case wins)
      const priority = { expired: 3, expiring: 2, valid: 1 };
      if ((priority[itemStatus] || 0) > (priority[dateMap[key].status] || 0)) {
        dateMap[key].status = itemStatus;
      }
    };

    vehicles.forEach((v) => {
      addToDate(v.insuranceExpiry, v.vehicleNumber, 'Insurance');
      addToDate(v.pollutionExpiry, v.vehicleNumber, 'Pollution');
      addToDate(v.gpsExpiry, v.vehicleNumber, 'GPS');
    });

    res.json({ success: true, data: Object.values(dateMap) });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/chart/monthly
const getMonthlyChart = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const vehicles = await Vehicle.find({ isActive: true }).lean();
    const months = Array.from({ length: 12 }, () => ({ insurance: 0, pollution: 0, gps: 0 }));

    vehicles.forEach((v) => {
      const addIfYear = (date, type) => {
        if (!date) return;
        const d = new Date(date);
        if (d.getFullYear() === year) {
          months[d.getMonth()][type]++;
        }
      };
      addIfYear(v.insuranceExpiry, 'insurance');
      addIfYear(v.pollutionExpiry, 'pollution');
      addIfYear(v.gpsExpiry, 'gps');
    });

    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    res.json({
      success: true,
      data: {
        labels,
        insurance: months.map((m) => m.insurance),
        pollution: months.map((m) => m.pollution),
        gps: months.map((m) => m.gps),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/chart/distribution
const getDistributionChart = async (req, res, next) => {
  try {
    const today = getToday();
    const vehicles = await Vehicle.find({ isActive: true }).lean();

    let expired = 0, expiringSoon = 0, valid = 0;

    vehicles.forEach((v) => {
      const fields = [v.insuranceExpiry, v.pollutionExpiry, v.gpsExpiry];
      fields.forEach((expiry) => {
        if (!expiry) return;
        const d = new Date(expiry);
        const daysLeft = Math.floor((d - today) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) expired++;
        else if (daysLeft <= 30) expiringSoon++;
        else valid++;
      });
    });

    res.json({ success: true, data: { expired, expiringSoon, valid } });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/activity
const getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/reminder-stats
const getReminderStats = async (req, res, next) => {
  try {
    const today = getToday();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = await ReminderLog.aggregate([
      { $match: { sentAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          mock: { $sum: { $cond: [{ $eq: ['$status', 'mock'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getTodayWidget, getCalendar, getMonthlyChart, getDistributionChart, getActivity, getReminderStats };
