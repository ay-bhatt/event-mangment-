import pool from '../config/db.js';

export const getMyOrganization = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const [organizations] = await connection.execute(
      'SELECT * FROM organizations WHERE id = ?',
      [req.user.organization_id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ organization: organizations[0] });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};

export const updateOrganization = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { businessEmail, website, country, address, logo, timezone, currency } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [];

    if (businessEmail !== undefined) { updates.push('business_email = ?'); values.push(businessEmail); }
    if (website !== undefined) { updates.push('website = ?'); values.push(website); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (logo !== undefined) { updates.push('logo = ?'); values.push(logo); }
    if (timezone !== undefined) { updates.push('timezone = ?'); values.push(timezone); }
    if (currency !== undefined) { updates.push('currency = ?'); values.push(currency); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.user.organization_id);

    await connection.execute(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated organization
    const [organizations] = await connection.execute(
      'SELECT * FROM organizations WHERE id = ?',
      [req.user.organization_id]
    );

    res.json({ organization: organizations[0] });
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
};
