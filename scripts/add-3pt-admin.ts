import { config } from 'dotenv';
import { Client } from 'pg';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

// Load environment variables
config();

async function main() {
  const username = '3pt';
  const email = '3pt@3pt.bot';
  const password = 'test2222'; // Same default password as footy user

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM neon_auth.admin_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      console.log('✅ User "3pt" already exists. Updating to admin...');

      const result = await client.query(
        `UPDATE neon_auth.admin_users
         SET role = 'admin', is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE username = $1
         RETURNING username, email, role, is_active`,
        [username]
      );

      console.log('Username:', result.rows[0].username);
      console.log('Email:', result.rows[0].email);
      console.log('Role:', result.rows[0].role);
      console.log('Active:', result.rows[0].is_active);
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const result = await client.query(
      `INSERT INTO neon_auth.admin_users
       (id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING username, email, role`,
      [randomUUID(), username, email, hashedPassword, 'admin', true]
    );

    console.log('✅ Admin user "3pt" created successfully:');
    console.log('Username:', result.rows[0].username);
    console.log('Email:', result.rows[0].email);
    console.log('Role:', result.rows[0].role);
    console.log('Password:', password);
  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
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
