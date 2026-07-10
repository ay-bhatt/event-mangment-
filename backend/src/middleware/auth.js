<<<<<<< HEAD
import { verifyAccessToken } from '../utils/token.js';
import pool from '../config/db.js';

export const protect = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = verifyAccessToken(token);
    
    const [users] = await connection.execute(
      'SELECT id, organization_id, first_name, last_name, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  } finally {
    connection.release();
  }
};
=======
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { queryOne } from '../config/database.js'

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.jwt.secret)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export const authenticateUser = authenticate
export async function loadUser(req, res, next) {
  try {
    const user = await queryOne(
      `SELECT id, username, email, role, full_name, is_active
       FROM users WHERE id = ? AND is_active = 1`,
      [req.user.id],
    )
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' })
    }
    req.dbUser = user
    next()
  } catch (err) {
    next(err)
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' })
    }
    next()
  }
}

export { authenticate }
>>>>>>> 596041dd872ed2d87ec020683ec940e19571c71c
