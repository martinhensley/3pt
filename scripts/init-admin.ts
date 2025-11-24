import { config } from 'dotenv';
import { Client } from 'pg';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

// Load environment variables
config();

async function main() {
  const username = '3pt';
  const email = '3pt@3pt.bot';
  const password = 'test2222';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Create neon_auth schema if it doesn't exist
    console.log('Creating neon_auth schema...');
    await client.query('CREATE SCHEMA IF NOT EXISTS neon_auth');

    // Create admin_users table if it doesn't exist
    console.log('Creating admin_users table...');
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

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_email
      ON neon_auth.admin_users(email)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_users_username
      ON neon_auth.admin_users(username)
    `);

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM neon_auth.admin_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const result = await client.query(
      `INSERT INTO neon_auth.admin_users
       (id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, email`,
      [randomUUID(), username, email, hashedPassword, 'admin', true]
    );

    console.log('Admin user created successfully:');
    console.log('Username:', result.rows[0].username);
    console.log('Email:', result.rows[0].email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
