require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const Settings = require('../src/models/Settings');
const env = require('../src/config/env');

const seed = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');

    // Create default admin user
    const existingUser = await User.findOne({ username: 'admin' });
    if (!existingUser) {
      await User.create({
        username: 'admin',
        passwordHash: 'Admin@1234',
        displayName: 'Administrator',
        role: 'admin',
        mustChangePassword: true,
      });
      console.log('✅ Default admin created: admin / Admin@1234');
      console.log('⚠️  Please change the password on first login!');
    } else {
      console.log('ℹ️  Admin user already exists, skipping.');
    }

    // Create default settings
    const existingSettings = await Settings.findOne({ key: 'main' });
    if (!existingSettings) {
      await Settings.create({
        key: 'main',
        companyName: 'Fleet Reminder Pro',
        timezone: 'Asia/Kolkata',
        reminderDays: [30, 15, 7, 4, 2, 1, 0],
      });
      console.log('✅ Default settings created.');
    } else {
      console.log('ℹ️  Settings already exist, skipping.');
    }

    console.log('\n🚀 Database seeded successfully!');
    console.log('You can now start the server with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
