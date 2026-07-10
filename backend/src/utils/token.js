import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';

export const generateAccessToken = (userId, organizationId) => {
  return jwt.sign(
    { userId, organizationId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );
};

export const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  return token;
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};
