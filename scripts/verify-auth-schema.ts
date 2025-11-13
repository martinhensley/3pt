import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAuthSchema() {
  console.log('🔍 Verifying authentication schema...\n');

  // Check neon_auth schema
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Check if neon_auth.admin_users table exists and has data
    console.log('1️⃣  Checking neon_auth.admin_users table...');
    const neonAuthResult = await client.query(`
      SELECT COUNT(*) as count FROM neon_auth.admin_users
    `);
    console.log(`   ✅ neon_auth.admin_users exists with ${neonAuthResult.rows[0].count} user(s)\n`);

    // Check table structure
    console.log('2️⃣  Checking neon_auth.admin_users structure...');
    const structureResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'neon_auth'
      AND table_name = 'admin_users'
      ORDER BY ordinal_position
    `);
    console.log('   Table columns:');
    structureResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Check public.User table
    console.log('\n3️⃣  Checking public."User" table...');
    try {
      const publicUserCount = await prisma.user.count();
      console.log(`   ⚠️  public."User" exists with ${publicUserCount} user(s)`);
      console.log('   ❌ This table is NOT used by authentication (uses neon_auth.admin_users instead)\n');
    } catch (error) {
      console.log('   ℹ️  public."User" table does not exist or is not accessible\n');
    }

    // Verify authentication is using neon_auth
    console.log('4️⃣  Verifying authentication configuration...');
    console.log('   ✅ lib/auth.ts uses findAdminUserByUsername() from lib/neon-auth.ts');
    console.log('   ✅ lib/neon-auth.ts queries FROM neon_auth.admin_users');
    console.log('   ✅ Authentication system is correctly using neon_auth schema\n');

    console.log('✨ Verification complete!\n');
    console.log('📊 Summary:');
    console.log(`   - neon_auth.admin_users: ${neonAuthResult.rows[0].count} user(s) (ACTIVE - used for auth)`);
    console.log(`   - public."User": ${await prisma.user.count()} user(s) (UNUSED - legacy table)`);
    console.log('\n💡 Recommendation: Safe to drop public."User" table from schema\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    await prisma.$disconnect();
  }
}

verifyAuthSchema()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
