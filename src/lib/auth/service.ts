import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { createSessionToken } from './session'

export interface UserRecord {
  id: string
  auth_provider_id: string
  email: string
  created_at: string
  updated_at: string
}

export class AuthService {
  static async signup(email: string, password?: string): Promise<{ user: UserRecord; token: string }> {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('Valid email address is required')
    }

    const db = getDb()

    // Check if user already exists
    const existing = await db.query<UserRecord>('SELECT * FROM users WHERE email = $1', [normalizedEmail])
    if (existing.rows.length > 0) {
      throw new Error('User already exists with this email')
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const authProviderId = `auth_${userId}`
    const passwordHash = password ? await bcrypt.hash(password, 10) : null
    const now = new Date().toISOString()

    const insertRes = await db.query<UserRecord>(
      `INSERT INTO users (id, auth_provider_id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, authProviderId, normalizedEmail, passwordHash, now, now]
    )

    // Create a default watchlist for the new user
    const watchlistId = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await db.query(
      `INSERT INTO watchlists (id, user_id, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [watchlistId, userId, 'My Watchlist', now, now]
    )

    // Add initial default watchlist items (e.g. RELIANCE, TCS, INFY)
    const defaultSymbols = ['RELIANCE', 'TCS', 'INFY']
    for (const sym of defaultSymbols) {
      const itemId = `wi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.query(
        `INSERT INTO watchlist_items (id, watchlist_id, symbol, created_at)
         VALUES ($1, $2, $3, $4)`,
        [itemId, watchlistId, sym, now]
      )
      // Initialize last_seen_timestamp to server time
      const stateId = `uss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      await db.query(
        `INSERT INTO user_symbol_state (id, user_id, symbol, last_seen_timestamp, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, symbol) DO NOTHING`,
        [stateId, userId, sym, now, now, now]
      )
    }

    const user: UserRecord = {
      id: userId,
      auth_provider_id: authProviderId,
      email: normalizedEmail,
      created_at: now,
      updated_at: now,
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      authProviderId: user.auth_provider_id,
    })

    return { user, token }
  }

  static async login(email: string, password?: string): Promise<{ user: UserRecord; token: string }> {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      throw new Error('Email is required')
    }

    const db = getDb()
    const res = await db.query<any>('SELECT * FROM users WHERE email = $1', [normalizedEmail])
    if (res.rows.length === 0) {
      // If user does not exist in demo/evaluation mode, auto-provision
      return this.signup(email, password)
    }

    const userRow = res.rows[0]

    // Verify password if hash exists and password was supplied
    if (userRow.password_hash && password) {
      const isValid = await bcrypt.compare(password, userRow.password_hash)
      if (!isValid) {
        throw new Error('Invalid credentials')
      }
    }

    const user: UserRecord = {
      id: userRow.id,
      auth_provider_id: userRow.auth_provider_id,
      email: userRow.email,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      authProviderId: user.auth_provider_id,
    })

    return { user, token }
  }

  static async getUserById(userId: string): Promise<UserRecord | null> {
    const db = getDb()
    const res = await db.query<UserRecord>('SELECT id, auth_provider_id, email, created_at, updated_at FROM users WHERE id = $1', [userId])
    return res.rows[0] || null
  }
}
