import { Client } from 'pg';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  is_active: boolean;
  role: string;
}

async function getClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

export async function findAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const client = await getClient();

  try {
    const result = await client.query(
      'SELECT * FROM neon_auth.admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as AdminUser;
  } catch (error) {
    console.error('Error finding admin user:', error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function findAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const client = await getClient();

  try {
    const result = await client.query(
      'SELECT * FROM neon_auth.admin_users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as AdminUser;
  } catch (error) {
    console.error('Error finding admin user by email:', error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function updateLastLogin(userId: string): Promise<void> {
  const client = await getClient();

  try {
    await client.query(
      'UPDATE neon_auth.admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw - this is non-critical
  } finally {
    await client.end();
  }
}
