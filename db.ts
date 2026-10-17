import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'battleclash.db');
export const db = new DatabaseSync(DB_PATH);

// Helper for hashing passwords
export function hashPassword(password: string): string {
  const salt = 'battleclash_esports_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

// Helper to generate secure tokens
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function initDatabase() {
  function addColumnIfNotExists(table: string, column: string, columnDef: string) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const exists = cols.some((c) => c.name === column);
      if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef};`);
      }
    } catch (e) {
      console.warn(`Migration check for ${table}.${column}:`, e);
    }
  }

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      ign TEXT NOT NULL,
      ff_uid TEXT NOT NULL,
      level INTEGER DEFAULT 45,
      rank_tier TEXT DEFAULT 'Heroic',
      avatar TEXT DEFAULT 'ninja',
      guild TEXT DEFAULT 'None',
      wallet_coins INTEGER DEFAULT 250,
      wallet_inr_deposit REAL DEFAULT 0.0,
      wallet_inr_winnings REAL DEFAULT 0.0,
      wallet_inr_bonus REAL DEFAULT 50.0,
      bio TEXT DEFAULT 'Free Fire Competitive Player',
      created_at TEXT NOT NULL
    );
  `);

  // Active user sessions/tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Tournaments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      game_mode TEXT NOT NULL, -- 'Solo', 'Duo', 'Squad'
      map_name TEXT NOT NULL,  -- 'Bermuda', 'Purgatory', 'Kalahari', 'Alpine'
      banner_url TEXT,
      entry_fee INTEGER DEFAULT 0,
      prize_pool INTEGER NOT NULL,
      first_prize INTEGER NOT NULL,
      per_kill_pts INTEGER DEFAULT 1,
      total_slots INTEGER NOT NULL DEFAULT 48,
      status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
      scheduled_at TEXT NOT NULL,
      room_id TEXT DEFAULT '',
      room_password TEXT DEFAULT '',
      room_status TEXT DEFAULT 'pending', -- 'pending', 'published'
      rules TEXT,
      stream_url TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      ign TEXT NOT NULL,
      ff_uid TEXT NOT NULL,
      team_name TEXT DEFAULT '',
      teammate_uids TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'confirmed',
      slot_number INTEGER,
      registered_at TEXT NOT NULL,
      UNIQUE(tournament_id, user_id),
      FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Match results table (Official Free Fire scoring)
  db.exec(`
    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      ign TEXT NOT NULL,
      ff_uid TEXT NOT NULL,
      team_name TEXT DEFAULT '',
      placement INTEGER NOT NULL,
      kills INTEGER NOT NULL DEFAULT 0,
      placement_points INTEGER NOT NULL DEFAULT 0,
      kill_points INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      prize_won INTEGER DEFAULT 0,
      verified_by_admin INTEGER DEFAULT 1,
      screenshot_url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'room_credentials', 'result', 'wallet', 'general'
      tournament_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Player Wallet Transactions (In-game tournament points & real INR ledger)
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL, -- Positive for credits, negative for debits
      currency TEXT NOT NULL DEFAULT 'INR',
      balance_type TEXT NOT NULL DEFAULT 'deposit', -- 'deposit', 'winnings', 'bonus'
      status TEXT NOT NULL DEFAULT 'completed',     -- 'completed', 'pending', 'failed', 'refunded'
      reference_id TEXT DEFAULT '',
      type TEXT NOT NULL,      -- 'welcome_bonus', 'entry_fee', 'refund', 'tournament_prize', 'kill_bounty', 'admin_adjustment', 'wallet_topup', 'deposit', 'withdrawal', 'withdrawal_refund'
      description TEXT NOT NULL,
      tournament_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Payment Orders (Business Gateway Payments with Server-Side Verification)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_number TEXT UNIQUE NOT NULL,
      amount_inr REAL NOT NULL,
      coins_awarded INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed', 'refunded', 'cancelled'
      provider TEXT NOT NULL DEFAULT 'sandbox_gateway',
      provider_order_id TEXT,
      provider_payment_id TEXT,
      provider_signature TEXT,
      qr_payload TEXT NOT NULL,
      verification_source TEXT DEFAULT 'unverified', -- 'server_webhook_hmac', 'server_gateway_check', 'unverified'
      notes TEXT DEFAULT '',
      refund_id TEXT,
      refund_amount REAL DEFAULT 0.0,
      refund_status TEXT DEFAULT '',
      refund_reason TEXT DEFAULT '',
      refunded_at TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Withdrawal Requests (Withdrawable Tournament Winnings Payouts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      request_number TEXT UNIQUE NOT NULL,
      amount_inr REAL NOT NULL,
      tds_rate REAL DEFAULT 0.0,
      tds_amount_inr REAL DEFAULT 0.0,
      net_payout_inr REAL NOT NULL,
      payout_mode TEXT NOT NULL, -- 'upi' or 'bank_transfer'
      account_holder_name TEXT NOT NULL,
      payout_address TEXT NOT NULL, -- UPI ID (VPA) or Account Details
      bank_ifsc TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'processing', 'completed', 'rejected'
      provider_payout_id TEXT DEFAULT '',
      provider_status TEXT DEFAULT '',
      rejection_reason TEXT DEFAULT '',
      admin_notes TEXT DEFAULT '',
      processed_by TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Compliance & Security Audit Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  // Migrations for existing database instances
  addColumnIfNotExists('users', 'wallet_inr_deposit', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('users', 'wallet_inr_winnings', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('users', 'wallet_inr_bonus', 'REAL DEFAULT 50.0');

  addColumnIfNotExists('wallet_transactions', 'currency', "TEXT DEFAULT 'INR'");
  addColumnIfNotExists('wallet_transactions', 'balance_type', "TEXT DEFAULT 'deposit'");
  addColumnIfNotExists('wallet_transactions', 'status', "TEXT DEFAULT 'completed'");
  addColumnIfNotExists('wallet_transactions', 'reference_id', "TEXT DEFAULT ''");

  addColumnIfNotExists('payment_orders', 'refund_id', 'TEXT');
  addColumnIfNotExists('payment_orders', 'refund_amount', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('payment_orders', 'refund_status', "TEXT DEFAULT ''");
  addColumnIfNotExists('payment_orders', 'refund_reason', "TEXT DEFAULT ''");
  addColumnIfNotExists('payment_orders', 'refunded_at', 'TEXT');

  seedInitialData();
}

function seedInitialData() {
  const isTournamentsSeeded = db.prepare('SELECT COUNT(id) as count FROM tournaments').get() as any;
  const now = new Date();
  const defaultAdminId = 'usr_admin_001';

  // Seed default admin if no admin exists in the database
  const adminCheck = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, ign, ff_uid, level, rank_tier, avatar, guild, wallet_coins, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      defaultAdminId,
      'admin@battleclash.gg',
      hashPassword('admin123'),
      'admin',
      'BattleClash_Marshal',
      '100000001',
      75,
      'Grandmaster',
      'crown',
      'Staff GG',
      9999,
      'Official BattleClash Tournament Coordinator & Verifier.',
      now.toISOString()
    );
  }

  if (isTournamentsSeeded.count === 0) {
    const playerId = 'usr_player_001';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, ign, ff_uid, level, rank_tier, avatar, guild, wallet_coins, bio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      playerId,
      'pro_slayer@battleclash.gg',
      hashPassword('player123'),
      'player',
      '⚡ViperX',
      '849201948',
      62,
      'Heroic',
      'ninja',
      'SoulEaters',
      680,
      'Free Fire Rusher & Sniper. Aiming for National Qualifiers!',
      new Date().toISOString()
    );

    // Additional competitive players for realistic lobbies
    const seedPlayers = [
      { id: 'usr_p2', email: 'phoenix@freefire.gg', ign: 'Phoenix_Ace', uid: '918237461', level: 59, rank: 'Master', guild: 'Phoenix Rising' },
      { id: 'usr_p3', email: 'ghost@freefire.gg', ign: 'Ghost_Reaper', uid: '736291048', level: 66, rank: 'Grandmaster', guild: 'DarkOps' },
      { id: 'usr_p4', email: 'aura@freefire.gg', ign: 'Aura_Snipe', uid: '648201957', level: 54, rank: 'Heroic', guild: 'Aura Clan' },
      { id: 'usr_p5', email: 'bullet@freefire.gg', ign: 'Bullet_King', uid: '539102847', level: 51, rank: 'Diamond IV', guild: 'Redline' },
    ];

    for (const p of seedPlayers) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, ign, ff_uid, level, rank_tier, avatar, guild, wallet_coins, bio, created_at)
        VALUES (?, ?, ?, 'player', ?, ?, ?, ?, 'helmet', ?, 350, 'Competitive FF warrior', ?)
      `).run(
        p.id,
        p.email,
        hashPassword('player123'),
        p.ign,
        p.uid,
        p.level,
        p.rank,
        p.guild,
        new Date().toISOString()
      );
    }

    // Seed tournaments
    const now = new Date();
    const tourney1Date = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
    const tourney2Date = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow
    const tourney3Date = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // yesterday (completed)

    // Tournament 1: Ready soon with published room details!
    const t1Id = 'trny_ff_bermuda_42';
    db.prepare(`
      INSERT INTO tournaments (
        id, title, game_mode, map_name, banner_url, entry_fee, prize_pool, first_prize,
        per_kill_pts, total_slots, status, scheduled_at, room_id, room_password, room_status, rules, stream_url, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t1Id,
      'Bermuda Prime Clash - Series #42',
      'Solo',
      'Bermuda',
      '/src/assets/images/bermuda_map_card_1791955690832.jpg',
      0,
      1500,
      800,
      1,
      48,
      'upcoming',
      tourney1Date,
      'FF-ROOM-88291',
      'GOLD88',
      'published',
      '1. No emulators or PC players allowed.\n2. Room opens 15 mins prior. Match starts promptly at schedule.\n3. Hackers/cheaters will be permanently hardware banned.\n4. Screen recording mandatory for top 3 finishers.',
      'https://youtube.com/live/freefire-community',
      defaultAdminId,
      now.toISOString()
    );

    // Register our demo player in Tournament 1
    db.prepare(`
      INSERT INTO registrations (id, tournament_id, user_id, ign, ff_uid, team_name, status, slot_number, registered_at)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 1, ?)
    `).run('reg_001', t1Id, playerId, '⚡ViperX', '849201948', 'Solo Raider', now.toISOString());

    // Register other players
    db.prepare(`
      INSERT INTO registrations (id, tournament_id, user_id, ign, ff_uid, team_name, status, slot_number, registered_at)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 2, ?)
    `).run('reg_002', t1Id, 'usr_p2', 'Phoenix_Ace', '918237461', 'Phoenix', now.toISOString());

    db.prepare(`
      INSERT INTO registrations (id, tournament_id, user_id, ign, ff_uid, team_name, status, slot_number, registered_at)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 3, ?)
    `).run('reg_003', t1Id, 'usr_p3', 'Ghost_Reaper', '736291048', 'DarkOps', now.toISOString());

    // Tournament 2: Squad Championship (Upcoming, room pending)
    const t2Id = 'trny_ff_purgatory_squad';
    db.prepare(`
      INSERT INTO tournaments (
        id, title, game_mode, map_name, banner_url, entry_fee, prize_pool, first_prize,
        per_kill_pts, total_slots, status, scheduled_at, room_id, room_password, room_status, rules, stream_url, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t2Id,
      'Purgatory Squad Mayhem Championship',
      'Squad',
      'Purgatory',
      '/src/assets/images/purgatory_map_card_1791955691708.jpg',
      50,
      3500,
      2000,
      2,
      12,
      'upcoming',
      tourney2Date,
      'FF-ROOM-49102',
      'PASS99',
      'pending', // Not published yet - will test disclosure privacy!
      '1. Squad captain must register full team.\n2. In-game voice chat or Discord voice required.\n3. Revival points enabled. Airdrops active.\n4. Admin decision is final.',
      '',
      defaultAdminId,
      now.toISOString()
    );

    // Tournament 3: Completed Tournament with full Match Results & Leaderboard
    const t3Id = 'trny_ff_kalahari_blitz';
    db.prepare(`
      INSERT INTO tournaments (
        id, title, game_mode, map_name, banner_url, entry_fee, prize_pool, first_prize,
        per_kill_pts, total_slots, status, scheduled_at, room_id, room_password, room_status, rules, stream_url, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t3Id,
      'Kalahari Sniper Masters Invitational',
      'Solo',
      'Kalahari',
      '/src/assets/images/battleclash_banner_1791955690388.jpg',
      20,
      2000,
      1000,
      1,
      48,
      'completed',
      tourney3Date,
      'FF-ROOM-11029',
      'WINNER',
      'published',
      '1. Sniper rifles and DMRs only.\n2. Fair play rules strictly enforced.',
      'https://youtube.com/live/replays',
      defaultAdminId,
      tourney3Date
    );

    // Seed verified match results for Kalahari Blitz
    // Free fire scoring: 1st=12pts, 2nd=9pts, 3rd=8pts, 4th=7pts, 5th=6pts, 6th=5pts... + kills
    const results = [
      { uid: 'usr_p3', ign: 'Ghost_Reaper', ff_uid: '736291048', placement: 1, kills: 7, placement_pts: 12, kill_pts: 7, total: 19, prize: 1000 },
      { uid: playerId, ign: '⚡ViperX', ff_uid: '849201948', placement: 2, kills: 6, placement_pts: 9, kill_pts: 6, total: 15, prize: 600 },
      { uid: 'usr_p2', ign: 'Phoenix_Ace', ff_uid: '918237461', placement: 3, kills: 4, placement_pts: 8, kill_pts: 4, total: 12, prize: 400 },
      { uid: 'usr_p4', ign: 'Aura_Snipe', ff_uid: '648201957', placement: 4, kills: 3, placement_pts: 7, kill_pts: 3, total: 10, prize: 0 },
      { uid: 'usr_p5', ign: 'Bullet_King', ff_uid: '539102847', placement: 5, kills: 2, placement_pts: 6, kill_pts: 2, total: 8, prize: 0 },
    ];

    for (const r of results) {
      db.prepare(`
        INSERT INTO match_results (
          id, tournament_id, user_id, ign, ff_uid, team_name, placement, kills,
          placement_points, kill_points, total_points, prize_won, verified_by_admin, created_at
        ) VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        `res_${r.uid}_${t3Id}`,
        t3Id,
        r.uid,
        r.ign,
        r.ff_uid,
        r.placement,
        r.kills,
        r.placement_pts,
        r.kill_pts,
        r.total,
        r.prize,
        tourney3Date
      );
    }

    // Seed a notification for demo player
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, tournament_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      'notif_001',
      playerId,
      'Room Credentials Published!',
      'Room ID and Password for Bermuda Prime Clash #42 are now live. Enter Free Fire custom room early!',
      'room_credentials',
      t1Id,
      now.toISOString()
    );
  }

  // Ensure wallet transactions exist for demonstration
  const txCount = db.prepare('SELECT COUNT(id) as count FROM wallet_transactions').get() as any;
  if (txCount.count === 0) {
    const demoPlayer = 'usr_player_001';
    const nowIso = new Date().toISOString();
    const pastIso = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    const tourney3Date = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const initialTxs = [
      {
        id: 'tx_seed_001',
        user_id: demoPlayer,
        amount: 200,
        type: 'welcome_bonus',
        description: 'Welcome Bonus: BattleClash Rookie Esports Points credited',
        tournament_id: null,
        created_at: pastIso,
      },
      {
        id: 'tx_seed_002',
        user_id: demoPlayer,
        amount: -20,
        type: 'entry_fee',
        description: 'Entry Fee: Kalahari Sniper Masters Invitational',
        tournament_id: 'trny_ff_kalahari_blitz',
        created_at: pastIso,
      },
      {
        id: 'tx_seed_003',
        user_id: demoPlayer,
        amount: 600,
        type: 'tournament_prize',
        description: 'Prize Payout: #2 Runner Up + 6 Verified Kills in Kalahari Blitz',
        tournament_id: 'trny_ff_kalahari_blitz',
        created_at: tourney3Date,
      },
      {
        id: 'tx_seed_004',
        user_id: demoPlayer,
        amount: -100,
        type: 'entry_fee',
        description: 'Entry Fee: Bermuda Prime Clash - Series #42',
        tournament_id: 'trny_ff_bermuda_42',
        created_at: nowIso,
      },
    ];

    for (const tx of initialTxs) {
      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, amount, type, description, tournament_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(tx.id, tx.user_id, tx.amount, tx.type, tx.description, tx.tournament_id, tx.created_at);
    }
  }

  // Ensure initial payment orders exist for demonstration
  const payCount = db.prepare('SELECT COUNT(id) as count FROM payment_orders').get() as any;
  if (payCount.count === 0) {
    const demoPlayer = 'usr_player_001';
    const player2 = 'usr_player_002';
    const nowIso = new Date().toISOString();
    const past1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const initialOrders = [
      {
        id: 'pay_ord_seed_101',
        user_id: demoPlayer,
        order_number: 'BCO-2026-9041',
        amount_inr: 100,
        coins_awarded: 250,
        currency: 'INR',
        status: 'verified',
        provider: 'sandbox_gateway',
        provider_order_id: 'order_gw_live_8391',
        provider_payment_id: 'pay_gw_settled_938102',
        provider_signature: 'hmac_sha256_verified_sample_hash',
        qr_payload: 'upi://pay?pa=merchant.battleclash@esportsgateway&pn=BattleClash+Esports&am=100&tr=BCO-2026-9041&cu=INR&tn=CoinPackage-250-BCO-2026-9041',
        verification_source: 'server_webhook_hmac',
        notes: 'Gateway Webhook Event: payment.captured (Auto-verified by server HMAC)',
        verified_at: past24h,
        created_at: past24h,
        updated_at: past24h
      },
      {
        id: 'pay_ord_seed_102',
        user_id: demoPlayer,
        order_number: 'BCO-2026-9082',
        amount_inr: 200,
        coins_awarded: 600,
        currency: 'INR',
        status: 'pending',
        provider: 'sandbox_gateway',
        provider_order_id: 'order_gw_live_8422',
        provider_payment_id: null,
        provider_signature: null,
        qr_payload: 'upi://pay?pa=merchant.battleclash@esportsgateway&pn=BattleClash+Esports&am=200&tr=BCO-2026-9082&cu=INR&tn=CoinPackage-600-BCO-2026-9082',
        verification_source: 'unverified',
        notes: 'Awaiting webhook settlement confirmation from payment gateway provider.',
        verified_at: null,
        created_at: past1h,
        updated_at: past1h
      },
      {
        id: 'pay_ord_seed_103',
        user_id: player2,
        order_number: 'BCO-2026-8975',
        amount_inr: 50,
        coins_awarded: 100,
        currency: 'INR',
        status: 'failed',
        provider: 'sandbox_gateway',
        provider_order_id: 'order_gw_live_8310',
        provider_payment_id: null,
        provider_signature: null,
        qr_payload: 'upi://pay?pa=merchant.battleclash@esportsgateway&pn=BattleClash+Esports&am=50&tr=BCO-2026-8975&cu=INR&tn=CoinPackage-100-BCO-2026-8975',
        verification_source: 'server_gateway_check',
        notes: 'Gateway reported: Session expired / payment not authorized by issuing bank.',
        verified_at: null,
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const ord of initialOrders) {
      db.prepare(`
        INSERT INTO payment_orders (
          id, user_id, order_number, amount_inr, coins_awarded, currency,
          status, provider, provider_order_id, provider_payment_id, provider_signature,
          qr_payload, verification_source, notes, verified_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ord.id, ord.user_id, ord.order_number, ord.amount_inr, ord.coins_awarded, ord.currency,
        ord.status, ord.provider, ord.provider_order_id, ord.provider_payment_id, ord.provider_signature,
        ord.qr_payload, ord.verification_source, ord.notes, ord.verified_at, ord.created_at, ord.updated_at
      );
    }
  }

  // Ensure demo player has realistic real-money INR balances initialized
  try {
    db.prepare(`
      UPDATE users 
      SET wallet_inr_deposit = CASE WHEN wallet_inr_deposit = 0 THEN 150.0 ELSE wallet_inr_deposit END,
          wallet_inr_winnings = CASE WHEN wallet_inr_winnings = 0 THEN 420.0 ELSE wallet_inr_winnings END,
          wallet_inr_bonus = CASE WHEN wallet_inr_bonus = 0 THEN 50.0 ELSE wallet_inr_bonus END
      WHERE id = 'usr_player_001'
    `).run();
  } catch (e) {
    console.warn('Init user balance check:', e);
  }

  // Ensure initial withdrawal requests exist for demonstration
  const wdrCount = db.prepare('SELECT COUNT(id) as count FROM withdrawal_requests').get() as any;
  if (wdrCount.count === 0) {
    const demoPlayer = 'usr_player_001';
    const past1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO withdrawal_requests (
        id, user_id, request_number, amount_inr, tds_rate, tds_amount_inr,
        net_payout_inr, payout_mode, account_holder_name, payout_address, bank_ifsc,
        status, provider_payout_id, provider_status, rejection_reason, admin_notes,
        processed_by, processed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'wdr_seed_001',
      demoPlayer,
      'WDR-2026-0419',
      200.0,
      0.0,
      0.0,
      200.0,
      'upi',
      '⚡ViperX Esports',
      'viper.esports@okhdfcbank',
      '',
      'pending_review',
      '',
      '',
      '',
      'Awaiting Marshal admin review and approved payout gateway execution',
      null,
      null,
      past1h,
      past1h
    );

    db.prepare(`
      INSERT INTO withdrawal_requests (
        id, user_id, request_number, amount_inr, tds_rate, tds_amount_inr,
        net_payout_inr, payout_mode, account_holder_name, payout_address, bank_ifsc,
        status, provider_payout_id, provider_status, rejection_reason, admin_notes,
        processed_by, processed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'wdr_seed_002',
      demoPlayer,
      'WDR-2026-0382',
      150.0,
      0.0,
      0.0,
      150.0,
      'upi',
      '⚡ViperX Esports',
      'viper.esports@okhdfcbank',
      '',
      'completed',
      'pout_rzp_live_981240',
      'SUCCESS',
      '',
      'Disbursed via approved business payout route',
      'usr_admin_001',
      past24h,
      past24h,
      past24h
    );
  }

  // Support custom admin credentials from server-side environment secrets
  const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD?.trim();
  const envAdminIgn = process.env.ADMIN_IGN?.trim() || 'BattleClash_Marshal';
  const envAdminUid = process.env.ADMIN_UID?.trim() || '100000001';

  if (envAdminEmail && envAdminPassword) {
    if (envAdminPassword.length >= 6) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(envAdminEmail) as any;
      const pwdHash = hashPassword(envAdminPassword);
      if (existing) {
        db.prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?").run(pwdHash, existing.id);
      } else {
        const newAdminId = `usr_admin_${crypto.randomBytes(6).toString('hex')}`;
        db.prepare(`
          INSERT INTO users (id, email, password_hash, role, ign, ff_uid, level, rank_tier, avatar, guild, wallet_coins, bio, created_at)
          VALUES (?, ?, ?, 'admin', ?, ?, 75, 'Grandmaster', 'crown', 'Staff GG', 9999, 'BattleClash Tournament Coordinator', ?)
        `).run(newAdminId, envAdminEmail, pwdHash, envAdminIgn, envAdminUid, new Date().toISOString());
      }

      // Keep demo admin account active alongside custom admin for sandbox testing
      const demoAdminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@battleclash.gg');
      if (!demoAdminExists) {
        db.prepare(`
          INSERT INTO users (id, email, password_hash, role, ign, ff_uid, level, rank_tier, avatar, guild, wallet_coins, bio, created_at)
          VALUES ('usr_admin_001', 'admin@battleclash.gg', ?, 'admin', 'BattleClash_Marshal', '100000001', 75, 'Grandmaster', 'crown', 'Staff GG', 9999, 'Official BattleClash Tournament Coordinator & Verifier.', ?)
        `).run(hashPassword('admin123'), new Date().toISOString());
      }

      // Safe logging: never prints password or sensitive token values
      console.log('[SECURITY] Custom administrator account verified and synchronized from server environment secrets.');
    } else {
      console.warn('[SECURITY] Warning: ADMIN_PASSWORD secret must be at least 6 characters long.');
    }
  }
}


