export interface User {
  id: string;
  email: string;
  role: 'player' | 'admin';
  ign: string;
  ff_uid: string;
  level: number;
  rank_tier: string;
  avatar: string;
  guild: string;
  wallet_coins: number;
  wallet_inr_deposit: number;
  wallet_inr_winnings: number;
  wallet_inr_bonus: number;
  total_balance_inr?: number;
  bio: string;
  created_at: string;
}

export interface PlayerStats {
  tournamentsJoined: number;
  totalKills: number;
  totalPoints: number;
  booyahsWon: number;
  totalEarnings: number;
}

export interface Tournament {
  id: string;
  title: string;
  game_mode: 'Solo' | 'Duo' | 'Squad';
  map_name: 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine';
  banner_url?: string;
  entry_fee: number;
  prize_pool: number;
  first_prize: number;
  per_kill_pts: number;
  total_slots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_at: string;
  room_status: 'pending' | 'published';
  rules?: string;
  stream_url?: string;
  registered_count: number;
  isUserRegistered: boolean;
  slotsRemaining: number;
  isFull: boolean;
}

export interface TournamentDetail extends Tournament {
  userRegistration?: {
    id: string;
    slot_number: number;
    status: string;
    registered_at: string;
  } | null;
  participants: Array<{
    id: string;
    user_id: string;
    ign: string;
    ff_uid: string;
    team_name?: string;
    slot_number: number;
    registered_at: string;
    rank_tier: string;
    level: number;
  }>;
}

export interface RoomDetailsResponse {
  authorized: boolean;
  error?: string;
  registeredRequired?: boolean;
  roomStatus?: 'pending' | 'published';
  message?: string;
  scheduledAt?: string;
  tournamentTitle?: string;
  slotNumber?: number | string;
  roomId?: string;
  roomPassword?: string;
  instructions?: string[];
}

export interface MatchResult {
  id: string;
  placement: number;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
  prize_won: number;
  ign: string;
  ff_uid: string;
  team_name?: string;
  avatar?: string;
  rank_tier?: string;
  notes?: string;
  verified_by_admin: number;
}

export interface GlobalLeaderboardPlayer {
  id: string;
  ign: string;
  ff_uid: string;
  rank_tier: string;
  avatar: string;
  guild: string;
  tournaments_played: number;
  total_kills: number;
  total_points: number;
  booyahs: number;
  total_earnings: number;
}

export interface PlayerMatchRecord {
  tournament_id: string;
  title: string;
  game_mode: string;
  map_name: string;
  scheduled_at: string;
  tournament_status: string;
  registered_at: string;
  slot_number: number;
  placement?: number;
  kills?: number;
  placement_points?: number;
  kill_points?: number;
  total_points?: number;
  prize_won?: number;
  result_time?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'room_credentials' | 'result' | 'wallet' | 'general';
  tournament_id?: string;
  is_read: number;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency?: string;
  balance_type?: 'deposit' | 'winnings' | 'bonus';
  status?: 'completed' | 'pending' | 'failed' | 'refunded';
  reference_id?: string;
  type: 'welcome_bonus' | 'entry_fee' | 'refund' | 'tournament_prize' | 'kill_bounty' | 'admin_adjustment' | 'wallet_topup' | 'deposit' | 'withdrawal' | 'withdrawal_refund';
  description: string;
  tournament_id?: string;
  created_at: string;
}

export interface AdminRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  ign: string;
  ff_uid: string;
  team_name?: string;
  teammate_uids?: string;
  status: string;
  slot_number: number;
  registered_at: string;
  rank_tier: string;
  level: number;
  email: string;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  order_number: string;
  amount_inr: number;
  coins_awarded: number;
  currency: string;
  status: 'pending' | 'verified' | 'failed' | 'refunded' | 'cancelled';
  provider: string;
  provider_order_id?: string | null;
  provider_payment_id?: string | null;
  provider_signature?: string | null;
  qr_payload: string;
  verification_source: string;
  notes?: string;
  refund_id?: string | null;
  refund_amount?: number;
  refund_status?: string | null;
  refund_reason?: string | null;
  refunded_at?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
  // Included in admin views
  ign?: string;
  ff_uid?: string;
  email?: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  request_number: string;
  amount_inr: number;
  tds_rate: number;
  tds_amount_inr: number;
  net_payout_inr: number;
  payout_mode: 'upi' | 'bank_transfer';
  account_holder_name: string;
  payout_address: string;
  bank_ifsc?: string;
  status: 'pending_review' | 'processing' | 'completed' | 'rejected';
  provider_payout_id?: string;
  provider_status?: string;
  rejection_reason?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  // Included in admin views
  ign?: string;
  ff_uid?: string;
  email?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface CoinPackage {
  id: string;
  title: string;
  coins: number;
  amount_inr: number;
  badge?: string;
  popular?: boolean;
  bonusPercent?: number;
}

export interface SystemStatus {
  database: {
    engine: string;
    status: string;
    tables: {
      users: number;
      tournaments: number;
      registrations: number;
      match_results: number;
      wallet_transactions?: number;
      payment_orders?: number;
    };
  };
  androidApkReady: {
    capacitorConfigured: boolean;
    appId: string;
    webDir: string;
    pwaManifestActive: boolean;
    mobileViewportConfigured: boolean;
    stepsToGenerateApk: string[];
  };
}



