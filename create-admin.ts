import { db, hashPassword } from '../db.js';
import crypto from 'node:crypto';

// Command-line script to securely create or promote an admin account
// Usage: npx tsx server/scripts/create-admin.ts <email> <password> [ign] [ff_uid]

function run() {
  const args = process.argv.slice(2);
  const email = args[0]?.trim().toLowerCase();
  const password = args[1]?.trim();
  const ign = args[2]?.trim() || 'BattleClash_Marshal';
  const ffUid = args[3]?.trim() || '100000001';

  if (!email || !password) {
    console.error('Usage: npx tsx server/scripts/create-admin.ts <email> <password> [ign] [ff_uid]');
    console.error('Example: npx tsx server/scripts/create-admin.ts myadmin@example.com MyStrongPass123! "Marshal_Dan" 849201948');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters long.');
    process.exit(1);
  }

  const existingUser = db.prepare('SELECT id, email, role, ign FROM users WHERE email = ?').get(email) as any;

  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  if (existingUser) {
    // Promote existing account to admin and update password
    db.prepare(`
      UPDATE users
      SET role = 'admin',
          password_hash = ?,
          ign = COALESCE(?, ign),
          ff_uid = COALESCE(?, ff_uid)
      WHERE id = ?
    `).run(passwordHash, ign, ffUid, existingUser.id);

    console.log(`[SUCCESS] Existing user ${email} (${existingUser.ign}) has been promoted to 'admin' role.`);
  } else {
    // Create new admin account
    const newAdminId = `usr_admin_${crypto.randomBytes(6).toString('hex')}`;
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, role, ign, ff_uid, level, rank_tier,
        avatar, guild, wallet_coins, bio, created_at
      ) VALUES (?, ?, ?, 'admin', ?, ?, 75, 'Grandmaster', 'crown', 'Staff GG', 9999, 'BattleClash Tournament Coordinator', ?)
    `).run(newAdminId, email, passwordHash, ign, ffUid, now);

    console.log(`[SUCCESS] New Administrator account created:`);
    console.log(`- User ID: ${newAdminId}`);
    console.log(`- Email: ${email}`);
    console.log(`- IGN: ${ign}`);
    console.log(`- Role: admin (verified on backend)`);
  }

  process.exit(0);
}

run();
