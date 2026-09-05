import { getDb } from '@/lib/db'

export interface WatchlistRecord {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  items?: WatchlistItemRecord[]
}

export interface WatchlistItemRecord {
  id: string
  watchlist_id: string
  symbol: string
  created_at: string
  name?: string
  exchange?: string
  currency?: string
}

export interface SymbolRecord {
  symbol: string
  name: string
  exchange: string
  currency: string
  created_at: string
}

export class WatchlistService {
  static async getWatchlistsForUser(userId: string): Promise<WatchlistRecord[]> {
    const db = getDb()
    const res = await db.query<WatchlistRecord>(
      'SELECT * FROM watchlists WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    )

    const watchlists = res.rows
    for (const wl of watchlists) {
      const itemsRes = await db.query<WatchlistItemRecord>(
        'SELECT * FROM watchlist_items WHERE watchlist_id = $1 ORDER BY created_at ASC',
        [wl.id]
      )
      wl.items = itemsRes.rows
    }

    return watchlists
  }

  static async getWatchlistById(watchlistId: string, userId: string): Promise<WatchlistRecord | null> {
    const db = getDb()
    const res = await db.query<WatchlistRecord>(
      'SELECT * FROM watchlists WHERE user_id = $1 AND id = $2',
      [userId, watchlistId]
    )

    if (res.rows.length === 0) return null

    const wl = res.rows[0]
    const itemsRes = await db.query<WatchlistItemRecord>(
      'SELECT * FROM watchlist_items WHERE watchlist_id = $1 ORDER BY created_at ASC',
      [wl.id]
    )
    wl.items = itemsRes.rows
    return wl
  }

  static async createWatchlist(userId: string, name: string): Promise<WatchlistRecord> {
    const db = getDb()
    const id = `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    const trimmedName = name.trim() || 'New Watchlist'

    await db.query(
      'INSERT INTO watchlists (id, user_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, trimmedName, now, now]
    )

    return {
      id,
      user_id: userId,
      name: trimmedName,
      created_at: now,
      updated_at: now,
      items: [],
    }
  }

  static async deleteWatchlist(watchlistId: string, userId: string): Promise<boolean> {
    const db = getDb()
    const res = await db.query(
      'DELETE FROM watchlists WHERE user_id = $1 AND id = $2',
      [userId, watchlistId]
    )
    return res.rowCount > 0
  }

  static async addSymbolToWatchlist(watchlistId: string, userId: string, rawSymbol: string): Promise<WatchlistItemRecord> {
    const symbol = rawSymbol.trim().toUpperCase()
    if (!symbol) throw new Error('Symbol cannot be empty')

    const db = getDb()

    // 1. Verify watchlist ownership
    const wl = await this.getWatchlistById(watchlistId, userId)
    if (!wl) {
      throw new Error('Watchlist not found or unauthorized')
    }

    // 2. Ensure symbol is registered in symbols table
    const symRes = await db.query<SymbolRecord>('SELECT * FROM symbols WHERE symbol = $1', [symbol])
    if (symRes.rows.length === 0) {
      // Auto-register symbol metadata
      const isIndian = !['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'].includes(symbol)
      await db.query(
        `INSERT INTO symbols (symbol, name, exchange, currency, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (symbol) DO NOTHING`,
        [symbol, `${symbol} Equity`, isIndian ? 'NSE' : 'NASDAQ', isIndian ? 'INR' : 'USD']
      )
    }

    // 3. Add to watchlist_items (enforce uniqueness)
    const existing = (wl.items || []).find(i => i.symbol === symbol)
    if (existing) {
      return existing
    }

    const itemId = `wi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    await db.query(
      'INSERT INTO watchlist_items (id, watchlist_id, symbol, created_at) VALUES ($1, $2, $3, $4)',
      [itemId, watchlistId, symbol, now]
    )

    // 4. Initialize user_symbol_state if not already tracked
    const stateId = `uss_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await db.query(
      `INSERT INTO user_symbol_state (id, user_id, symbol, last_seen_timestamp, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, symbol) DO NOTHING`,
      [stateId, userId, symbol, now, now, now]
    )

    return {
      id: itemId,
      watchlist_id: watchlistId,
      symbol,
      created_at: now,
    }
  }

  static async removeSymbolFromWatchlist(watchlistId: string, userId: string, rawSymbol: string): Promise<boolean> {
    const symbol = rawSymbol.trim().toUpperCase()
    const db = getDb()

    // Verify ownership
    const wl = await this.getWatchlistById(watchlistId, userId)
    if (!wl) {
      throw new Error('Watchlist not found or unauthorized')
    }

    const res = await db.query(
      'DELETE FROM watchlist_items WHERE watchlist_id = $1 AND symbol = $2',
      [watchlistId, symbol]
    )
    return res.rowCount > 0
  }

  static async searchSymbols(query: string): Promise<SymbolRecord[]> {
    const trimmed = query.trim()
    const db = getDb()
    if (!trimmed) {
      const res = await db.query<SymbolRecord>('SELECT * FROM symbols LIMIT 20')
      return res.rows
    }
    const res = await db.query<SymbolRecord>(
      'SELECT * FROM symbols WHERE symbol ILIKE $1 OR name ILIKE $1 LIMIT 20',
      [`%${trimmed}%`]
    )
    return res.rows
  }
}
