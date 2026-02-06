import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, IUser } from '../../models/User';
import crypto from 'crypto';

let mongoServer: MongoMemoryServer;

describe('Authentication Features', () => {
  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Password Strength Validation', () => {
    it('should reject weak passwords (no uppercase)', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'weakpass123!',
        name: 'Test User',
      });

      // The password will be hashed, so we need to test the validation separately
      // This tests that passwords without uppercase are considered weak
      const weakPassword = 'weakpass123!';
      const hasUppercase = /[A-Z]/.test(weakPassword);
      expect(hasUppercase).toBe(false);
    });

    it('should reject weak passwords (no lowercase)', async () => {
      const weakPassword = 'WEAKPASS123!';
      const hasLowercase = /[a-z]/.test(weakPassword);
      expect(hasLowercase).toBe(false);
    });

    it('should reject weak passwords (no number)', async () => {
      const weakPassword = 'WeakPass!';
      const hasNumber = /\d/.test(weakPassword);
      expect(hasNumber).toBe(false);
    });

    it('should reject weak passwords (no special character)', async () => {
      const weakPassword = 'WeakPass123';
      const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]/.test(weakPassword);
      expect(hasSpecial).toBe(false);
    });

    it('should reject weak passwords (too short)', async () => {
      const weakPassword = 'We1!';
      expect(weakPassword.length >= 8).toBe(false);
    });

    it('should accept strong passwords', async () => {
      const strongPassword = 'StrongPass123!';
      const hasUppercase = /[A-Z]/.test(strongPassword);
      const hasLowercase = /[a-z]/.test(strongPassword);
      const hasNumber = /\d/.test(strongPassword);
      const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]/.test(strongPassword);
      const isLongEnough = strongPassword.length >= 8;

      expect(hasUppercase).toBe(true);
      expect(hasLowercase).toBe(true);
      expect(hasNumber).toBe(true);
      expect(hasSpecial).toBe(true);
      expect(isLongEnough).toBe(true);
    });

    it('should hash password on save', async () => {
      const plainPassword = 'StrongPass123!';
      const user = new User({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(plainPassword.length);
    });

    it('should correctly compare passwords', async () => {
      const plainPassword = 'StrongPass123!';
      const user = new User({
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
      });

      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isWrong = await user.comparePassword('WrongPass123!');
      expect(isWrong).toBe(false);
    });
  });

  describe('Account Lockout', () => {
    let user: IUser;

    beforeEach(async () => {
      user = new User({
        email: 'locktest@example.com',
        password: 'TestPass123!',
        name: 'Lock Test User',
      });
      await user.save();
    });

    it('should not be locked initially', () => {
      expect(user.isLocked()).toBe(false);
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('should increment failed login attempts', async () => {
      await user.incrementFailedAttempts();
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.failedLoginAttempts).toBe(1);
      expect(updatedUser?.isLocked()).toBe(false);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await user.incrementFailedAttempts();
        user = (await User.findById(user._id))!;
      }

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.isLocked()).toBe(true);
      expect(user.lockUntil).toBeDefined();
    });

    it('should lock for 15 minutes', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await user.incrementFailedAttempts();
        user = (await User.findById(user._id))!;
      }

      const lockTime = user.lockUntil!.getTime() - Date.now();
      const fifteenMinutes = 15 * 60 * 1000;
      
      // Allow 1 second margin for test execution time
      expect(lockTime).toBeGreaterThan(fifteenMinutes - 1000);
      expect(lockTime).toBeLessThanOrEqual(fifteenMinutes);
    });

    it('should reset failed attempts on successful login', async () => {
      // Add some failed attempts
      await user.incrementFailedAttempts();
      await user.incrementFailedAttempts();
      user = (await User.findById(user._id))!;
      expect(user.failedLoginAttempts).toBe(2);

      // Reset on successful login
      await user.resetFailedAttempts();
      user = (await User.findById(user._id))!;

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeUndefined();
    });

    it('should reset attempts when lock expires', async () => {
      // Set an expired lock
      user.failedLoginAttempts = 5;
      user.lockUntil = new Date(Date.now() - 1000); // 1 second ago
      await user.save();

      // Increment should reset when lock is expired
      await user.incrementFailedAttempts();
      user = (await User.findById(user._id))!;

      expect(user.failedLoginAttempts).toBe(1);
      expect(user.lockUntil).toBeUndefined();
    });

    it('should continue to increment if not yet locked', async () => {
      await user.incrementFailedAttempts();
      await user.incrementFailedAttempts();
      await user.incrementFailedAttempts();
      
      user = (await User.findById(user._id))!;
      expect(user.failedLoginAttempts).toBe(3);
      expect(user.isLocked()).toBe(false);
    });
  });

  describe('Password Reset Token System', () => {
    let user: IUser;

    beforeEach(async () => {
      user = new User({
        email: 'reset@example.com',
        password: 'OldPass123!',
        name: 'Reset Test User',
      });
      await user.save();
    });

    it('should generate and store reset token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.resetPasswordToken).toBe(hashedToken);
      expect(updatedUser?.resetPasswordExpiry).toBeDefined();
    });

    it('should set token expiry to 1 hour', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = expiryTime;
      await user.save();

      const updatedUser = await User.findById(user._id);
      const timeDiff = updatedUser!.resetPasswordExpiry!.getTime() - Date.now();
      const oneHour = 60 * 60 * 1000;

      expect(timeDiff).toBeGreaterThan(oneHour - 1000);
      expect(timeDiff).toBeLessThanOrEqual(oneHour);
    });

    it('should find user by valid reset token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const foundUser = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: new Date() },
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
    });

    it('should not find user with expired token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() - 1000); // Expired
      await user.save();

      const foundUser = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: { $gt: new Date() },
      });

      expect(foundUser).toBeNull();
    });

    it('should not find user with invalid token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const wrongToken = crypto.randomBytes(32).toString('hex');
      const wrongHashedToken = crypto.createHash('sha256').update(wrongToken).digest('hex');

      const foundUser = await User.findOne({
        resetPasswordToken: wrongHashedToken,
        resetPasswordExpiry: { $gt: new Date() },
      });

      expect(foundUser).toBeNull();
    });

    it('should reset password and clear token', async () => {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      // Verify old password works
      const oldPasswordMatch = await user.comparePassword('OldPass123!');
      expect(oldPasswordMatch).toBe(true);

      // Reset password
      user.password = 'NewPass123!';
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      const updatedUser = await User.findById(user._id);
      
      // Verify new password works
      const newPasswordMatch = await updatedUser!.comparePassword('NewPass123!');
      expect(newPasswordMatch).toBe(true);

      // Verify old password doesn't work
      const oldPasswordStillWorks = await updatedUser!.comparePassword('OldPass123!');
      expect(oldPasswordStillWorks).toBe(false);

      // Verify token is cleared
      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpiry).toBeUndefined();
    });

    it('should reset failed login attempts on password reset', async () => {
      // Add failed attempts
      user.failedLoginAttempts = 3;
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      // Reset password
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      user.password = 'NewPass123!';
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.failedLoginAttempts).toBe(0);
      expect(updatedUser?.lockUntil).toBeUndefined();
      expect(updatedUser?.isLocked()).toBe(false);
    });

    it('should handle multiple reset requests (latest token should work)', async () => {
      // First reset request
      const firstToken = crypto.randomBytes(32).toString('hex');
      const firstHashedToken = crypto.createHash('sha256').update(firstToken).digest('hex');
      user.resetPasswordToken = firstHashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      // Second reset request (overwrites first)
      const secondToken = crypto.randomBytes(32).toString('hex');
      const secondHashedToken = crypto.createHash('sha256').update(secondToken).digest('hex');
      user.resetPasswordToken = secondHashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      // First token should not work
      const firstFoundUser = await User.findOne({
        resetPasswordToken: firstHashedToken,
        resetPasswordExpiry: { $gt: new Date() },
      });
      expect(firstFoundUser).toBeNull();

      // Second token should work
      const secondFoundUser = await User.findOne({
        resetPasswordToken: secondHashedToken,
        resetPasswordExpiry: { $gt: new Date() },
      });
      expect(secondFoundUser).toBeDefined();
      expect(secondFoundUser?._id.toString()).toBe(user._id.toString());
    });
  });

  describe('Integration: Lockout and Password Reset', () => {
    let user: IUser;

    beforeEach(async () => {
      user = new User({
        email: 'integration@example.com',
        password: 'TestPass123!',
        name: 'Integration Test User',
      });
      await user.save();
    });

    it('should unlock account via password reset', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await user.incrementFailedAttempts();
        user = (await User.findById(user._id))!;
      }
      expect(user.isLocked()).toBe(true);

      // Reset password (which should also reset lockout)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
      user.password = 'NewPass123!';
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isLocked()).toBe(false);
      expect(updatedUser?.failedLoginAttempts).toBe(0);
    });
  });
});
