import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables
config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Get all admin users
    const result = await client.query(
      'SELECT id, username, email, is_active, role, created_at, last_login FROM neon_auth.admin_users'
    );

    console.log('Admin users in database:');
    console.log(result.rows);
  } catch (error) {
    console.error('Error checking users:', error);
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
