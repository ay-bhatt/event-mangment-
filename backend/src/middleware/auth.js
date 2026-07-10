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
