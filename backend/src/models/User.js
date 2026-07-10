import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const User = {
  // Create a new user
  async create(userData) {
    const {
      organizationId,
      firstName,
      lastName,
      email,
      password,
      role = 'admin',
      emailVerificationToken = null,
      emailVerificationExpires = null
    } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users 
      (organization_id, first_name, last_name, email, password, role, email_verification_token, email_verification_expires) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      organizationId,
      firstName,
      lastName,
      email,
      passwordHash,
      role,
      emailVerificationToken,
      emailVerificationExpires
    ]);

    return this.findById(result.insertId);
  },

  // Find user by ID
  async findById(id) {
    const query = `
      SELECT 
        u.*,
        o.id as organization_id,
        o.name as organization_name,
        o.business_email,
        o.website,
        o.country,
        o.address,
        o.logo,
        o.timezone,
        o.currency,
        o.plan
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `;
    const [users] = await db.execute(query, [id]);
    return users[0];
  },

  // Find user by email
  async findByEmail(email) {
    const query = `
      SELECT 
        u.*,
        o.id as organization_id,
        o.name as organization_name,
        o.business_email,
        o.website,
        o.country,
        o.address,
        o.logo,
        o.timezone,
        o.currency,
        o.plan
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = ?
    `;
    const [users] = await db.execute(query, [email]);
    return users[0];
  },

  // Find user by email verification token
  async findByEmailVerificationToken(token) {
    const query = 'SELECT * FROM users WHERE email_verification_token = ?';
    const [users] = await db.execute(query, [token]);
    return users[0];
  },

  // Update user
  async update(id, updates) {
    const {
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified,
      passwordResetToken,
      passwordResetExpires,
      password,
      isActive
    } = updates;

    let query = 'UPDATE users SET ';
    const params = [];

    if (emailVerificationToken !== undefined) {
      query += 'email_verification_token = ?, ';
      params.push(emailVerificationToken);
    }
    if (emailVerificationExpires !== undefined) {
      query += 'email_verification_expires = ?, ';
      params.push(emailVerificationExpires);
    }
    if (isEmailVerified !== undefined) {
      query += 'is_email_verified = ?, ';
      params.push(isEmailVerified);
    }
    if (passwordResetToken !== undefined) {
      query += 'password_reset_token = ?, ';
      params.push(passwordResetToken);
    }
    if (passwordResetExpires !== undefined) {
      query += 'password_reset_expires = ?, ';
      params.push(passwordResetExpires);
    }
    if (password !== undefined) {
      query += 'password = ?, ';
      const hash = await bcrypt.hash(password, 12);
      params.push(hash);
    }
    if (isActive !== undefined) {
      query += 'is_active = ?, ';
      params.push(isActive);
    }

    // Remove trailing comma
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    params.push(id);

    await db.execute(query, params);
    return this.findById(id);
  },

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
};

export default User;
