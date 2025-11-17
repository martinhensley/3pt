import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables
config();

async function main() {
  const username = '3pt';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM neon_auth.admin_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length === 0) {
      console.log(`User '${username}' not found in neon_auth.admin_users`);
      console.log('Available users:');
      const allUsers = await client.query('SELECT username, email, role, is_active FROM neon_auth.admin_users');
      console.table(allUsers.rows);
      return;
    }

    // Update user to be admin and active
    const result = await client.query(
      `UPDATE neon_auth.admin_users
       SET role = 'admin', is_active = true, updated_at = CURRENT_TIMESTAMP
       WHERE username = $1
       RETURNING username, email, role, is_active`,
      [username]
    );

    console.log('✅ User updated successfully:');
    console.log('Username:', result.rows[0].username);
    console.log('Email:', result.rows[0].email);
    console.log('Role:', result.rows[0].role);
    console.log('Active:', result.rows[0].is_active);
  } catch (error) {
    console.error('❌ Error updating user:', error);
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
