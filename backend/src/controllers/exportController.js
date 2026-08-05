const ExcelJS = require('exceljs');
const { Vehicle } = require('../models/Vehicle');

const getStatusLabel = (expiryDate) => {
  if (!expiryDate) return 'N/A';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(expiryDate);
  const daysLeft = Math.floor((d - today) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires Today';
  if (daysLeft <= 6) return `${daysLeft} Days Left`;
  if (daysLeft <= 30) return `${daysLeft} Days Left`;
  return 'Valid';
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// GET /api/export/vehicles
const exportVehicles = async (req, res, next) => {
  try {
    const { search = '', status = '' } = req.query;
    let matchQuery = { isActive: true };

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const vehicleIdNum = parseInt(search);
      const idQuery = !isNaN(vehicleIdNum) ? [{ vehicleId: vehicleIdNum }] : [];
      matchQuery.$or = [
        { vehicleNumber: searchRegex },
        { ownerName: searchRegex },
        { driverName: searchRegex },
        { whatsappNumber: searchRegex },
        ...idQuery,
      ];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (status === 'expired') {
      matchQuery.$or = [
        { insuranceExpiry: { $lt: today } },
        { pollutionExpiry: { $lt: today } },
        { gpsExpiry: { $lt: today } },
      ];
    }

    const vehicles = await Vehicle.find(matchQuery).sort({ vehicleId: 1 }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fleet Reminder Pro';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Vehicles', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Header styling
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    const borderStyle = { style: 'thin', color: { argb: 'FFCCCCCC' } };
    const allBorders = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };

    sheet.columns = [
      { header: 'ID', key: 'vehicleId', width: 8 },
      { header: 'Vehicle Number', key: 'vehicleNumber', width: 16 },
      { header: 'Owner Name', key: 'ownerName', width: 22 },
      { header: 'Driver Name', key: 'driverName', width: 20 },
      { header: 'WhatsApp', key: 'whatsappNumber', width: 16 },
      { header: 'Insurance Expiry', key: 'insuranceExpiry', width: 18 },
      { header: 'Insurance Status', key: 'insuranceStatus', width: 18 },
      { header: 'Pollution Expiry', key: 'pollutionExpiry', width: 18 },
      { header: 'Pollution Status', key: 'pollutionStatus', width: 18 },
      { header: 'GPS Expiry', key: 'gpsExpiry', width: 16 },
      { header: 'GPS Status', key: 'gpsStatus', width: 16 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = allBorders;
    });
    sheet.getRow(1).height = 22;

    // Add data rows
    vehicles.forEach((v, index) => {
      const row = sheet.addRow({
        vehicleId: v.vehicleId,
        vehicleNumber: v.vehicleNumber,
        ownerName: v.ownerName,
        driverName: v.driverName || '',
        whatsappNumber: v.whatsappNumber || '',
        insuranceExpiry: formatDate(v.insuranceExpiry),
        insuranceStatus: getStatusLabel(v.insuranceExpiry),
        pollutionExpiry: formatDate(v.pollutionExpiry),
        pollutionStatus: getStatusLabel(v.pollutionExpiry),
        gpsExpiry: formatDate(v.gpsExpiry),
        gpsStatus: getStatusLabel(v.gpsExpiry),
        notes: v.notes || '',
      });

      // Alternate row colors
      const bgColor = index % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = allBorders;
        cell.alignment = { vertical: 'middle', wrapText: false };
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Auto filter
    sheet.autoFilter = { from: 'A1', to: 'L1' };

    const filename = `fleet-vehicles-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { exportVehicles };
