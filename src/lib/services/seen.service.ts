import { getDb } from '@/lib/db'
import { WatchlistService } from '@/lib/watchlists/service'

export interface UserSymbolStateRecord {
  id: string
  user_id: string
  symbol: string
  last_seen_timestamp: string
  created_at: string
  updated_at: string
}

export class SeenService {
  /**
   * Retrieves last-seen timestamps for all symbols watched by a user.
   */
  static async getLastSeenMap(userId: string): Promise<Map<string, string>> {
    const db = getDb()
    const res = await db.query<UserSymbolStateRecord>(
      'SELECT symbol, last_seen_timestamp FROM user_symbol_state WHERE user_id = $1',
      [userId]
    )

    const map = new Map<string, string>()
    for (const r of res.rows) {
      map.set(r.symbol.toUpperCase(), r.last_seen_timestamp)
    }
    return map
  }

  /**
   * Marks a single symbol as seen using authoritative server time.
   * Section 45, 100: Never trust client-supplied timestamp; only move forward in time.
   */
  static async markSymbolSeen(userId: string, rawSymbol: string): Promise<{ success: boolean; lastSeen: string }> {
    const symbol = rawSymbol.trim().toUpperCase()
    const db = getDb()
    const now = new Date().toISOString()

    const stateId = `uss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    await db.query(
      `INSERT INTO user_symbol_state (id, user_id, symbol, last_seen_timestamp, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, symbol)
       DO UPDATE SET
         last_seen_timestamp = CASE
           WHEN EXCLUDED.last_seen_timestamp > user_symbol_state.last_seen_timestamp
           THEN EXCLUDED.last_seen_timestamp
           ELSE user_symbol_state.last_seen_timestamp
         END,
         updated_at = EXCLUDED.updated_at`,
      [stateId, userId, symbol, now, now, now]
    )

    return { success: true, lastSeen: now }
  }

  /**
   * Marks all symbols in the user's active watchlist as seen.
   * Section 46: Returns updated state and triggers "You're all caught up".
   */
  static async markAllSeen(userId: string, watchlistId?: string): Promise<{ success: boolean; count: number; timestamp: string }> {
    const db = getDb()
    const now = new Date().toISOString()

    // 1. Get user's symbols
    let symbolsToUpdate: string[] = []
    if (watchlistId) {
      const wl = await WatchlistService.getWatchlistById(watchlistId, userId)
      symbolsToUpdate = (wl?.items || []).map(i => i.symbol)
    } else {
      const watchlists = await WatchlistService.getWatchlistsForUser(userId)
      const set = new Set<string>()
      for (const w of watchlists) {
        for (const item of w.items || []) {
          set.add(item.symbol)
        }
      }
      symbolsToUpdate = Array.from(set)
    }

    let count = 0
    for (const sym of symbolsToUpdate) {
      await this.markSymbolSeen(userId, sym)
      count++
    }

    return { success: true, count, timestamp: now }
  }
}
