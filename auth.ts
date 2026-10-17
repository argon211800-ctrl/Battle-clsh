import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AuthenticatedUser {
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
  bio: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function getUserFromToken(token: string): AuthenticatedUser | null {
  if (!token) return null;
  const session = db.prepare(`
    SELECT s.user_id, u.*
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as any;

  if (!session) return null;

  return {
    id: session.id,
    email: session.email,
    role: session.role,
    ign: session.ign,
    ff_uid: session.ff_uid,
    level: session.level,
    rank_tier: session.rank_tier,
    avatar: session.avatar,
    guild: session.guild,
    wallet_coins: session.wallet_coins,
    bio: session.bio,
    created_at: session.created_at,
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const user = getUserFromToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }
  next();
}
