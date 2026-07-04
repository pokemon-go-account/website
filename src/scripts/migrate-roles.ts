/**
 * One-time DB migration: Upgrades all users with role='ADMIN' to role='SUPER_ADMIN'
 * Run once: npx tsx src/scripts/migrate-roles.ts
 */
import connectDB from '@/lib/db';
import User from '@/models/User';

async function migrateRoles() {
  await connectDB();

  const result = await (User as any).updateMany(
    { role: 'ADMIN' },
    { $set: { role: 'SUPER_ADMIN' } }
  );

  console.log(`✅ Migration complete: ${result.modifiedCount} user(s) upgraded from ADMIN → SUPER_ADMIN`);
  process.exit(0);
}

migrateRoles().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
