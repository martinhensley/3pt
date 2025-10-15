import { Client } from 'pg';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

async function setupNeonAuth() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to Neon database');

    // Create neon_auth schema
    await client.query('CREATE SCHEMA IF NOT EXISTS neon_auth');
    console.log('Created neon_auth schema');

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS neon_auth.admin_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        role TEXT DEFAULT 'admin'
      )
    `);
    console.log('Created admin_users table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email ON neon_auth.admin_users(email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_username ON neon_auth.admin_users(username)
    `);
    console.log('Created indexes');

    // Create update trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION neon_auth.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS update_admin_users_updated_at ON neon_auth.admin_users
    `);
    await client.query(`
      CREATE TRIGGER update_admin_users_updated_at
        BEFORE UPDATE ON neon_auth.admin_users
        FOR EACH ROW
        EXECUTE FUNCTION neon_auth.update_updated_at_column()
    `);
    console.log('Created update trigger');

    // Generate strong password
    const strongPassword = randomBytes(16).toString('base64').slice(0, 24) + 'Ft!1';
    const passwordHash = await hash(strongPassword, 12);

    // Generate user ID
    const userId = randomBytes(16).toString('hex');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM neon_auth.admin_users WHERE username = $1 OR email = $2',
      ['footy', 'footy@qb1.bot']
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      await client.query(
        `UPDATE neon_auth.admin_users
         SET password_hash = $1, email = $2, updated_at = CURRENT_TIMESTAMP
         WHERE username = $3`,
        [passwordHash, 'footy@qb1.bot', 'footy']
      );
      console.log('Updated existing admin user: footy');
    } else {
      // Create new admin user
      await client.query(
        `INSERT INTO neon_auth.admin_users (id, username, email, password_hash, is_active, role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, 'footy', 'footy@qb1.bot', passwordHash, true, 'admin']
      );
      console.log('Created new admin user: footy');
    }

    console.log('\n=================================');
    console.log('Admin User Credentials:');
    console.log('Username: footy');
    console.log('Email: footy@qb1.bot');
    console.log(`Password: ${strongPassword}`);
    console.log('=================================\n');
    console.log('IMPORTANT: Save this password securely!');

  } catch (error) {
    console.error('Error setting up Neon Auth:', error);
    throw error;
  } finally {
    await client.end();
  }
}

setupNeonAuth();
