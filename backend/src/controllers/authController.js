import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import sendEmail from '../utils/email.js';

export const register = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { firstName, lastName, email, password, organizationName } = req.body;

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const organizationSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check if organization already exists
    const [existingOrgs] = await connection.execute(
      'SELECT id FROM organizations WHERE slug = ?',
      [organizationSlug]
    );
    if (existingOrgs.length > 0) {
      return res.status(400).json({ message: 'Organization already exists' });
    }

    // Create organization
    const [orgResult] = await connection.execute(
      'INSERT INTO organizations (name, slug) VALUES (?, ?)',
      [organizationName, organizationSlug]
    );
    const organizationId = orgResult.insertId;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    // Create user
    await connection.execute(
      `INSERT INTO users 
       (organization_id, first_name, last_name, email, password, email_verification_token, email_verification_expires) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [organizationId, firstName, lastName, email, hashedPassword, emailVerificationToken, emailVerificationExpires]
    );

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail(
      email,
      'Verify your email',
      `<p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>`
    );

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const verifyEmail = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { token } = req.body;

    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email_verification_token = ? AND email_verification_expires > ?',
      [token, Date.now()]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    await connection.execute(
      'UPDATE users SET is_email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
      [users[0].id]
    );

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const login = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email, password } = req.body;

    // Get user with organization
    const [users] = await connection.execute(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug, o.business_email, o.website, o.country, o.address, o.logo, o.timezone, o.currency, o.plan
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    const accessToken = generateAccessToken(user.id, user.organization_id);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization_id,
          name: user.organization_name,
          slug: user.organization_slug,
          businessEmail: user.business_email,
          website: user.website,
          country: user.country,
          address: user.address,
          logo: user.logo,
          timezone: user.timezone,
          currency: user.currency,
          plan: user.plan
        }
      }
    });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const refreshToken = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Check refresh token
    const [tokens] = await connection.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ? AND revoked_at IS NULL',
      [refreshToken, Date.now()]
    );

    if (tokens.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const storedToken = tokens[0];

    // Get user
    const [users] = await connection.execute(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [storedToken.user_id]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const user = users[0];
    const newAccessToken = generateAccessToken(user.id, user.organization_id);
    const newRefreshToken = await generateRefreshToken(user.id);

    // Revoke old token
    await connection.execute(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?',
      [storedToken.id]
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const logout = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await connection.execute(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = ?',
        [refreshToken]
      );
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const forgotPassword = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { email } = req.body;

    const [users] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length > 0) {
      const passwordResetToken = crypto.randomBytes(32).toString('hex');
      const passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000;

      await connection.execute(
        'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
        [passwordResetToken, passwordResetExpires, users[0].id]
      );

      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${passwordResetToken}`;
      await sendEmail(
        email,
        'Reset your password',
        `<p>Please click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
      );
    }

    res.status(200).json({ message: 'If that email exists, a password reset link has been sent' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const resetPassword = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { token, password } = req.body;

    const [users] = await connection.execute(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > ?',
      [token, Date.now()]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await connection.execute(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const getMe = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug, o.business_email, o.website, o.country, o.address, o.logo, o.timezone, o.currency, o.plan 
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        organization: {
          id: user.organization_id,
          name: user.organization_name,
          slug: user.organization_slug,
          businessEmail: user.business_email,
          website: user.website,
          country: user.country,
          address: user.address,
          logo: user.logo,
          timezone: user.timezone,
          currency: user.currency,
          plan: user.plan
        }
      }
    });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};
