import {
  User,
  PlayerStats,
  Tournament,
  TournamentDetail,
  RoomDetailsResponse,
  MatchResult,
  GlobalLeaderboardPlayer,
  PlayerMatchRecord,
  NotificationItem,
  SystemStatus,
  WalletTransaction,
  AdminRegistration,
  PaymentOrder,
  CoinPackage,
  WithdrawalRequest,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'battleclash_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(payload: { email: string; password: string; ign: string; ff_uid: string; guild?: string; rank_tier?: string }) {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(payload: { email: string; password: string }) {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async adminLogin(payload: { email: string; password: string }) {
    const res = await request<{ message: string; token: string; user: User }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User; stats: PlayerStats }>('/api/auth/me');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout network errors
    } finally {
      setStoredToken(null);
    }
  },

  async updateProfile(payload: Partial<User>) {
    return request<{ message: string; user: User }>('/api/player/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Tournaments
  async getTournaments() {
    return request<Tournament[]>('/api/tournaments');
  },

  async getTournament(id: string) {
    return request<TournamentDetail>(`/api/tournaments/${id}`);
  },

  async registerTournament(id: string, payload: { team_name?: string; teammate_uids?: string } = {}) {
    return request<{ message: string; slotNumber: number; user: User }>(`/api/tournaments/${id}/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelRegistration(id: string) {
    return request<{ message: string }>(`/api/tournaments/${id}/register`, {
      method: 'DELETE',
    });
  },

  async getRoomDetails(id: string) {
    return request<RoomDetailsResponse>(`/api/tournaments/${id}/room-details`);
  },

  // Leaderboard & Matches
  async getTournamentLeaderboard(id: string) {
    return request<{
      tournament: Tournament;
      results: MatchResult[];
      scoringRules: {
        placementPoints: Record<number, number>;
        perKillPoints: number;
        booyahBonus: string;
      };
    }>(`/api/tournaments/${id}/leaderboard`);
  },

  async getGlobalLeaderboard() {
    return request<GlobalLeaderboardPlayer[]>('/api/leaderboard/global');
  },

  async getPlayerMatches() {
    return request<PlayerMatchRecord[]>('/api/player/matches');
  },

  // Real Money Wallet & Payments
  async getWalletHistory() {
    return request<{
      deposit_inr: number;
      winnings_inr: number;
      bonus_inr: number;
      total_playable_inr: number;
      total_withdrawable_inr: number;
      balance: number;
      wallet_coins: number;
      transactions: WalletTransaction[];
      compliance: {
        currency: string;
        ageRestricted: boolean;
        minimumAge: number;
        gameOfSkill: string;
        taxNotice: string;
        stateRestrictions: string[];
        zeroTrustPolicy: string;
      };
    }>('/api/player/wallet');
  },

  async getPaymentPackages() {
    return request<{
      cashPackages: any[];
      packages: CoinPackage[];
      provider: string;
      isLiveConfigured: boolean;
      payoutsLive: boolean;
      disclaimer: string;
    }>('/api/payments/packages');
  },

  async createPaymentOrder(payload: { packageId?: string; customAmountInr?: number; customCoins?: number }) {
    return request<{
      message: string;
      order: PaymentOrder;
      checkoutData?: any;
      qrPayload?: string;
      isLive?: boolean;
      merchantNotice: string;
    }>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyPaymentSignature(payload: { order_id: string; payment_id: string; signature: string }) {
    return request<{
      success: boolean;
      message: string;
      order: PaymentOrder;
      user: User;
    }>('/api/payments/verify-signature', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPaymentOrderStatus(orderId: string) {
    return request<{ order: PaymentOrder }>(`/api/payments/orders/${orderId}/status`);
  },

  async getMyPaymentOrders() {
    return request<{ orders: PaymentOrder[] }>('/api/payments/my-orders');
  },

  // Player Withdrawals
  async requestWithdrawal(payload: {
    amountInr: number;
    payoutMode: 'upi' | 'bank_transfer';
    accountHolderName: string;
    payoutAddress: string;
    bankIfsc?: string;
  }) {
    return request<{
      message: string;
      withdrawal: WithdrawalRequest;
      user: User;
      payoutModeConfigured: boolean;
    }>('/api/withdrawals/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyWithdrawals() {
    return request<{
      requests: WithdrawalRequest[];
      payoutModeConfigured: boolean;
      guideline: string;
    }>('/api/withdrawals/my-requests');
  },

  // Notifications
  async getNotifications() {
    return request<NotificationItem[]>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  // Admin
  async getAdminOverview() {
    return request<{
      metrics: {
        totalTournaments: number;
        totalPlayers: number;
        activeRooms: number;
        totalPrizeDistributed: number;
      };
      tournaments: any[];
    }>('/api/admin/overview');
  },

  async createTournament(payload: any) {
    return request<{ message: string; tournament: any }>('/api/admin/tournaments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTournament(tournamentId: string, payload: any) {
    return request<{ message: string; tournament: any }>(`/api/admin/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getAdminRegistrations(tournamentId: string) {
    return request<AdminRegistration[]>(`/api/admin/tournaments/${tournamentId}/registrations`);
  },

  async updateSlotAssignment(registrationId: string, slotNumber: number) {
    return request<{ message: string; slotNumber: number }>(`/api/admin/registrations/${registrationId}/slot`, {
      method: 'PUT',
      body: JSON.stringify({ slot_number: slotNumber }),
    });
  },

  async removeRegistration(registrationId: string) {
    return request<{ message: string }>(`/api/admin/registrations/${registrationId}`, {
      method: 'DELETE',
    });
  },

  async publishRoom(tournamentId: string, payload: { room_id: string; room_password: string }) {
    return request<{ message: string; roomId: string; roomPassword: string; notifiedPlayersCount: number }>(
      `/api/admin/tournaments/${tournamentId}/publish-room`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async verifyResults(tournamentId: string, payload: { results: any[]; finishTournament?: boolean }) {
    return request<{ message: string; submittedCount: number }>(`/api/admin/tournaments/${tournamentId}/verify-results`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin Payment Verification & Gateway
  async getAdminPayments(params?: { status?: string; q?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.q) query.append('q', params.q);
    const qs = query.toString() ? `?${query.toString()}` : '';

    return request<{
      payments: PaymentOrder[];
      metrics: {
        total: number;
        pending: number;
        verified: number;
        failed: number;
        totalVolumeInr: number;
        totalCoinsAwarded: number;
      };
    }>(`/api/admin/payments${qs}`);
  },

  async verifyPaymentWithGateway(orderId: string) {
    return request<{ message: string; order: PaymentOrder }>(`/api/admin/payments/${orderId}/verify-with-gateway`, {
      method: 'POST',
    });
  },

  async markPaymentFailed(orderId: string, reason?: string) {
    return request<{ message: string; order: PaymentOrder }>(`/api/admin/payments/${orderId}/mark-failed`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async simulateProviderWebhook(orderId: string) {
    return request<{
      success: boolean;
      message: string;
      order: PaymentOrder;
      signature: string;
    }>('/api/payments/simulate-provider-webhook', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  async refundPaymentOrder(orderId: string, reason: string) {
    return request<{ success: boolean; message: string; refund?: any }>(`/api/admin/payments/${orderId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getAdminWithdrawals(status?: string) {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    return request<{
      withdrawals: WithdrawalRequest[];
      metrics: {
        pending: number;
        completed: number;
        rejected: number;
        totalDisbursedInr: number;
        isLivePayoutConfigured: boolean;
      };
    }>(`/api/admin/withdrawals${qs}`);
  },

  async processAdminWithdrawal(
    withdrawalId: string,
    payload: { action: 'approve' | 'reject'; notes?: string; rejectionReason?: string }
  ) {
    return request<{ success: boolean; message: string; withdrawal?: WithdrawalRequest }>(
      `/api/admin/withdrawals/${withdrawalId}/action`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async getAuditLogs() {
    return request<AuditLog[]>('/api/admin/audit-logs');
  },

  async getGatewayConfig() {
    return request<{
      provider: string;
      merchantVpa: string;
      merchantName: string;
      isLiveConfigured: boolean;
      isPayoutLiveConfigured: boolean;
      hasGatewayKey: boolean;
      hasGatewaySecret: boolean;
      hasWebhookSecret: boolean;
      hasPayoutAccount: boolean;
      webhookEndpoint: string;
      supportedGateways: string[];
      complianceNotice: string;
    }>('/api/admin/payments/gateway-config');
  },

  // System Diagnostics & Android APK
  async getSystemStatus() {
    return request<SystemStatus>('/api/system/status');
  },
};
