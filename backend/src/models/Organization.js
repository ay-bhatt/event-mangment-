import db from '../config/db.js';

const Organization = {
  // Create a new organization
  async create(orgData) {
    const {
      name,
      slug,
      businessEmail = null,
      website = null,
      country = null,
      address = null,
      logo = null,
      timezone = null,
      currency = null,
      plan = 'free',
      status = 'active'
    } = orgData;

    const query = `
      INSERT INTO organizations 
      (name, slug, business_email, website, country, address, logo, timezone, currency, plan, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
      name,
      slug,
      businessEmail,
      website,
      country,
      address,
      logo,
      timezone,
      currency,
      plan,
      status
    ]);

    return this.findById(result.insertId);
  },

  // Find organization by ID
  async findById(id) {
    const query = 'SELECT * FROM organizations WHERE id = ?';
    const [organizations] = await db.execute(query, [id]);
    return organizations[0];
  },

  // Find organization by slug
  async findBySlug(slug) {
    const query = 'SELECT * FROM organizations WHERE slug = ?';
    const [organizations] = await db.execute(query, [slug]);
    return organizations[0];
  },

  // Update organization
  async update(id, updates) {
    const {
      businessEmail,
      website,
      country,
      address,
      logo,
      timezone,
      currency
    } = updates;

    let query = 'UPDATE organizations SET ';
    const params = [];

    if (businessEmail !== undefined) {
      query += 'business_email = ?, ';
      params.push(businessEmail);
    }
    if (website !== undefined) {
      query += 'website = ?, ';
      params.push(website);
    }
    if (country !== undefined) {
      query += 'country = ?, ';
      params.push(country);
    }
    if (address !== undefined) {
      query += 'address = ?, ';
      params.push(address);
    }
    if (logo !== undefined) {
      query += 'logo = ?, ';
      params.push(logo);
    }
    if (timezone !== undefined) {
      query += 'timezone = ?, ';
      params.push(timezone);
    }
    if (currency !== undefined) {
      query += 'currency = ?, ';
      params.push(currency);
    }

    // Remove trailing comma
    query = query.slice(0, -2);
    query += ' WHERE id = ?';
    params.push(id);

    await db.execute(query, params);
    return this.findById(id);
  }
};

export default Organization;
