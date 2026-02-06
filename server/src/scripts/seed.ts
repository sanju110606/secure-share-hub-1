import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config/config';

/**
 * Seed script to create initial admin user
 * Email: admin@example.com
 * Password: Admin123!
 */
async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      email: 'admin@example.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
