import { getDb } from '@/lib/db'

export type WatchReason = 'PRICE_TARGET' | 'OWN_IT' | 'CONSIDERING_BUY' | 'JUST_WATCHING'

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
  watch_reason?: WatchReason
  target_price?: number | null
  muted_until?: string | null
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

  static async addSymbolToWatchlist(
    watchlistId: string,
    userId: string,
    rawSymbol: string,
    watchReason: WatchReason = 'JUST_WATCHING',
    targetPrice?: number | null
  ): Promise<WatchlistItemRecord> {
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
      // Update intent if already in watchlist
      if (watchReason && watchReason !== existing.watch_reason) {
        await this.updateSymbolIntent(watchlistId, userId, symbol, watchReason, targetPrice)
        existing.watch_reason = watchReason
        existing.target_price = targetPrice ?? null
      }
      return existing
    }

    const itemId = `wi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    await db.query(
      'INSERT INTO watchlist_items (id, watchlist_id, symbol, watch_reason, target_price, muted_until, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [itemId, watchlistId, symbol, watchReason, targetPrice ?? null, null, now]
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
      watch_reason: watchReason,
      target_price: targetPrice ?? null,
      muted_until: null,
      created_at: now,
    }
  }

  static async updateSymbolIntent(
    watchlistId: string,
    userId: string,
    rawSymbol: string,
    watchReason: WatchReason,
    targetPrice?: number | null
  ): Promise<boolean> {
    const symbol = rawSymbol.trim().toUpperCase()
    const wl = await this.getWatchlistById(watchlistId, userId)
    if (!wl) throw new Error('Watchlist not found or unauthorized')

    const db = getDb()
    const res = await db.query(
      'UPDATE watchlist_items SET watch_reason = $1, target_price = $2 WHERE watchlist_id = $3 AND symbol = $4',
      [watchReason, targetPrice ?? null, watchlistId, symbol]
    )
    return res.rowCount > 0
  }

  static async muteSymbol(
    watchlistId: string,
    userId: string,
    rawSymbol: string,
    durationHours?: number | null
  ): Promise<{ success: boolean; mutedUntil: string | null }> {
    const symbol = rawSymbol.trim().toUpperCase()
    const wl = await this.getWatchlistById(watchlistId, userId)
    if (!wl) throw new Error('Watchlist not found or unauthorized')

    const db = getDb()
    let mutedUntil: string | null = null
    if (durationHours && durationHours > 0) {
      const d = new Date(Date.now() + durationHours * 60 * 60 * 1000)
      mutedUntil = d.toISOString()
    } else {
      // Indefinite mute (e.g. 10 years in future)
      const d = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)
      mutedUntil = d.toISOString()
    }

    await db.query(
      'UPDATE watchlist_items SET muted_until = $1 WHERE watchlist_id = $2 AND symbol = $3',
      [mutedUntil, watchlistId, symbol]
    )

    return { success: true, mutedUntil }
  }

  static async unmuteSymbol(
    watchlistId: string,
    userId: string,
    rawSymbol: string
  ): Promise<{ success: boolean }> {
    const symbol = rawSymbol.trim().toUpperCase()
    const wl = await this.getWatchlistById(watchlistId, userId)
    if (!wl) throw new Error('Watchlist not found or unauthorized')

    const db = getDb()
    await db.query(
      'UPDATE watchlist_items SET muted_until = $1 WHERE watchlist_id = $2 AND symbol = $3',
      [null, watchlistId, symbol]
    )

    return { success: true }
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

    // 1. Comprehensive built-in catalog of popular Indian & Global Equities
    const BUILTIN_CATALOG: Omit<SymbolRecord, 'created_at'>[] = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ZOMATO', name: 'Zomato Ltd. (Eternal)', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SWIGGY', name: 'Swiggy Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ITC', name: 'ITC Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'LTIM', name: 'LTIMindtree Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'CIPLA', name: 'Cipla Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd.", exchange: 'NSE', currency: 'INR' },
      { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd.", exchange: 'NSE', currency: 'INR' },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'COALINDIA', name: 'Coal India Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'NTPC', name: 'NTPC Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ADANIPORTS', name: 'Adani Ports & Special Economic Zone', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ADANIPOWER', name: 'Adani Power Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TITAN', name: 'Titan Company Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'IOC', name: 'Indian Oil Corporation Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Company Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'JIOFIN', name: 'Jio Financial Services Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'PAYTM', name: 'One 97 Communications Ltd. (Paytm)', exchange: 'NSE', currency: 'INR' },
      { symbol: 'NYKAA', name: 'FSN E-Commerce Ventures Ltd. (Nykaa)', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TRENT', name: 'Trent Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BEL', name: 'Bharat Electronics Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'IRFC', name: 'Indian Railway Finance Corporation Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'IRCTC', name: 'Indian Railway Catering & Tourism Corp', exchange: 'NSE', currency: 'INR' },
      { symbol: 'PFC', name: 'Power Finance Corporation Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'RECLTD', name: 'REC Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'VEDL', name: 'Vedanta Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SUZLON', name: 'Suzlon Energy Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'YESBANK', name: 'Yes Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', currency: 'USD' },
    ]

    const resultsMap = new Map<string, SymbolRecord>()

    // If query is empty, return default top symbols
    if (!trimmed) {
      BUILTIN_CATALOG.slice(0, 15).forEach((item) => {
        resultsMap.set(item.symbol, { ...item, created_at: new Date().toISOString() })
      })
      return Array.from(resultsMap.values())
    }

    const qLower = trimmed.toLowerCase()

    // 2. Search local database symbols table first
    try {
      const dbRes = await db.query<SymbolRecord>(
        'SELECT * FROM symbols WHERE symbol ILIKE $1 OR name ILIKE $1 LIMIT 20',
        [`%${trimmed}%`]
      )
      for (const row of dbRes.rows) {
        if (!row.symbol.startsWith('SYM_') && !row.symbol.startsWith('TEST_')) {
          resultsMap.set(row.symbol.toUpperCase(), row)
        }
      }
    } catch {
      // ignore
    }

    // 3. Search built-in catalog
    for (const item of BUILTIN_CATALOG) {
      if (
        item.symbol.toLowerCase().includes(qLower) ||
        item.name.toLowerCase().includes(qLower)
      ) {
        if (!resultsMap.has(item.symbol)) {
          resultsMap.set(item.symbol, { ...item, created_at: new Date().toISOString() })
        }
      }
    }

    // 4. Live online Yahoo Finance Search API fallback for any unlisted/longtail stocks
    if (resultsMap.size < 10) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 2500)
        const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(trimmed)}&lang=en-IN&region=IN&quotesCount=10&newsCount=0&enableFuzzyQuery=true`
        
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (res.ok) {
          const json = await res.json()
          const quotes = json?.quotes || []
          for (const q of quotes) {
            if (q.quoteType === 'EQUITY' || q.quoteType === 'ETF') {
              const rawSym: string = q.symbol || ''
              const cleanSym = rawSym.replace(/\.NS$|\.BO$/, '').toUpperCase()
              if (cleanSym && !resultsMap.has(cleanSym)) {
                const exchange = rawSym.endsWith('.BO') ? 'BSE' : (q.exchange === 'NSI' || rawSym.endsWith('.NS') ? 'NSE' : q.exchange || 'NSE')
                resultsMap.set(cleanSym, {
                  symbol: cleanSym,
                  name: q.shortname || q.longname || cleanSym,
                  exchange,
                  currency: rawSym.endsWith('.NS') || rawSym.endsWith('.BO') ? 'INR' : (q.currency || 'INR'),
                  created_at: new Date().toISOString(),
                })
              }
            }
          }
        }
      } catch {
        // Fallback gracefully on timeout/network issue
      }
    }

    return Array.from(resultsMap.values()).slice(0, 20)
  }
}

