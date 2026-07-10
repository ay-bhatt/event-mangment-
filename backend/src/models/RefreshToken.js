import db from '../config/db.js';

const RefreshToken = {
  // Create a new refresh token
  async create(tokenData) {
    const { userId, token, expiresAt } = tokenData;
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at) 
      VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, token, expiresAt]);
    return this.findById(result.insertId);
  },

  // Find token by token string
  async findByToken(token) {
    const query = 'SELECT * FROM refresh_tokens WHERE token = ?';
    const [tokens] = await db.execute(query, [token]);
    return tokens[0];
  },

  // Find token by ID
  async findById(id) {
    const query = 'SELECT * FROM refresh_tokens WHERE id = ?';
    const [tokens] = await db.execute(query, [id]);
    return tokens[0];
  },

  // Revoke (delete) a token
  async revoke(token) {
    const query = 'DELETE FROM refresh_tokens WHERE token = ?';
    await db.execute(query, [token]);
  },

  // Revoke all tokens for a user
  async revokeAllForUser(userId) {
    const query = 'DELETE FROM refresh_tokens WHERE user_id = ?';
    await db.execute(query, [userId]);
  }
};

export default RefreshToken;
