import { config } from 'dotenv';
import { Client } from 'pg';

// Load environment variables
config();

async function reviewNeonAuth() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to Neon database\n');

    // Check if neon_auth schema exists
    const schemaCheck = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name = 'neon_auth'
    `);
    console.log('=== SCHEMA CHECK ===');
    console.log('neon_auth schema exists:', schemaCheck.rows.length > 0);
    console.log('');

    // Get table structure
    const tableStructure = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'neon_auth'
        AND table_name = 'admin_users'
      ORDER BY ordinal_position
    `);

    console.log('=== TABLE STRUCTURE: neon_auth.admin_users ===');
    if (tableStructure.rows.length === 0) {
      console.log('⚠️  Table does not exist!');
    } else {
      console.table(tableStructure.rows);
    }
    console.log('');

    // Get constraints (unique, primary key)
    const constraints = await client.query(`
      SELECT
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'neon_auth'
        AND conrelid = 'neon_auth.admin_users'::regclass
      ORDER BY contype
    `);

    console.log('=== CONSTRAINTS ===');
    if (constraints.rows.length === 0) {
      console.log('No constraints found');
    } else {
      constraints.rows.forEach(row => {
        const type = {
          'p': 'PRIMARY KEY',
          'u': 'UNIQUE',
          'f': 'FOREIGN KEY',
          'c': 'CHECK'
        }[row.constraint_type] || row.constraint_type;
        console.log(`${row.constraint_name} (${type}): ${row.definition}`);
      });
    }
    console.log('');

    // Get admin users data (excluding password hash for security)
    const users = await client.query(`
      SELECT
        id,
        username,
        email,
        substring(password_hash, 1, 20) || '...' as password_hash_preview,
        length(password_hash) as password_hash_length,
        created_at,
        updated_at,
        last_login,
        is_active,
        role
      FROM neon_auth.admin_users
      ORDER BY created_at DESC
    `);

    console.log('=== ADMIN USERS ===');
    if (users.rows.length === 0) {
      console.log('⚠️  No admin users found!');
    } else {
      console.log(`Found ${users.rows.length} admin user(s):\n`);
      users.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password hash: ${user.password_hash_preview} (${user.password_hash_length} chars)`);
        console.log(`  Created: ${user.created_at}`);
        console.log(`  Updated: ${user.updated_at}`);
        console.log(`  Last login: ${user.last_login || 'Never'}`);
        console.log(`  Active: ${user.is_active}`);
        console.log(`  Role: ${user.role}`);
        console.log('');
      });
    }

    // Verify password hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const hashFormatCheck = await client.query(`
      SELECT
        username,
        substring(password_hash, 1, 7) as hash_prefix,
        length(password_hash) as hash_length,
        CASE
          WHEN password_hash ~ '^\$2[aby]\$[0-9]{2}\$' THEN 'Valid bcrypt format'
          ELSE 'Invalid format'
        END as hash_format_status
      FROM neon_auth.admin_users
    `);

    console.log('=== PASSWORD HASH FORMAT CHECK ===');
    hashFormatCheck.rows.forEach(row => {
      console.log(`${row.username}:`);
      console.log(`  Prefix: ${row.hash_prefix}`);
      console.log(`  Length: ${row.hash_length}`);
      console.log(`  Status: ${row.hash_format_status}`);
    });
    console.log('');

    console.log('=== REVIEW COMPLETE ===');

  } catch (error) {
    console.error('Error reviewing Neon Auth:', error);
    throw error;
  } finally {
    await client.end();
  }
}

reviewNeonAuth();
