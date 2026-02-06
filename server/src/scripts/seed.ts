import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config/config';

/**
 * Seed script to create initial admin and demo users
 * Admin: admin@example.com / Admin123!
 * Demo User: user@example.com / User123!
 */
async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected');

    let createdUsers = 0;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const admin = new User({
        email: 'admin@example.com',
        password: 'Admin123!',
        name: 'Admin User',
        role: 'admin',
      });

      await admin.save();
      console.log('✓ Admin user created successfully');
      console.log('  Email: admin@example.com');
      console.log('  Password: Admin123!');
      createdUsers++;
    }

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'user@example.com' });
    if (existingUser) {
      console.log('Demo user already exists');
    } else {
      // Create demo user
      const demoUser = new User({
        email: 'user@example.com',
        password: 'User123!',
        name: 'Demo User',
        role: 'user',
      });

      await demoUser.save();
      console.log('✓ Demo user created successfully');
      console.log('  Email: user@example.com');
      console.log('  Password: User123!');
      createdUsers++;
    }

    if (createdUsers === 0) {
      console.log('\nAll users already exist. No new users created.');
    } else {
      console.log(`\n✓ Seed completed: ${createdUsers} user(s) created`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
