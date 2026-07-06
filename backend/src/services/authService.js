import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { query, queryOne } from '../config/database.js'
import { env } from '../config/env.js'
import { createAuditLog } from './auditService.js'

export async function loginUser(username, password, meta = {}) {
  const user = await queryOne(
    `SELECT id, username, email, password_hash, role, full_name, is_active
     FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)`,
    [username.trim(), username.trim()],
  )

  if (!user || !user.is_active) {
    const err = new Error('Invalid username or password')
    err.status = 401
    throw err
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    const err = new Error('Invalid username or password')
    err.status = 401
    throw err
  }

  await query(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id])

  const loginResult = await query(
    `INSERT INTO login_history (user_id, ip_address, user_agent, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, meta.ipAddress ?? null, meta.userAgent ?? null, user.id, user.id],
  )

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  )

  await createAuditLog({
    userId: user.id,
    action: 'login',
    entityType: 'user',
    entityId: String(user.id),
    details: { loginHistoryId: loginResult.insertId },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: user.id,
  })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    loginHistoryId: loginResult.insertId,
  }
}

export async function logoutUser(userId, loginHistoryId, meta = {}) {
  if (loginHistoryId) {
    await query(
      `UPDATE login_history SET logout_at = NOW(), updated_by = ? WHERE id = ? AND user_id = ?`,
      [userId, loginHistoryId, userId],
    )
  }

  await createAuditLog({
    userId,
    action: 'logout',
    entityType: 'user',
    entityId: String(userId),
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    createdBy: userId,
  })
}

export async function validateSession(userId) {
  return queryOne(
    `SELECT id, username, email, role, full_name, is_active, last_login_at
     FROM users WHERE id = ? AND is_active = 1`,
    [userId],
  )
}

export async function requestPasswordReset(email) {
  const user = await queryOne(
    `SELECT id, email FROM users WHERE email = ? AND is_active = 1`,
    [email],
  )

  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000)

  await query(
    `UPDATE users SET password_reset_token = ?, password_reset_expires = ?, updated_by = ? WHERE id = ?`,
    [token, expires, user.id, user.id],
  )

  await createAuditLog({
    userId: user.id,
    action: 'password_reset',
    entityType: 'user',
    entityId: String(user.id),
    details: { requested: true },
    createdBy: user.id,
  })

  return {
    message: 'If that email exists, a reset link has been sent.',
    resetToken: env.nodeEnv === 'development' ? token : undefined,
  }
}

export async function resetPassword(token, newPassword) {
  const user = await queryOne(
    `SELECT id FROM users
     WHERE password_reset_token = ? AND password_reset_expires > NOW() AND is_active = 1`,
    [token],
  )

  if (!user) {
    const err = new Error('Invalid or expired reset token')
    err.status = 400
    throw err
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await query(
    `UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_by = ? WHERE id = ?`,
    [hash, user.id, user.id],
  )

  await createAuditLog({
    userId: user.id,
    action: 'password_reset',
    entityType: 'user',
    entityId: String(user.id),
    details: { completed: true },
    createdBy: user.id,
  })

  return { message: 'Password updated successfully' }
}
