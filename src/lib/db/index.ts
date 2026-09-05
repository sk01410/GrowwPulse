import { Pool, QueryResult } from 'pg'
import fs from 'fs'
import path from 'path'

// Global interface for DB query runner
export interface DatabaseClient {
  query<T = any>(sqlText: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>
  close(): Promise<void>
  isHealthy(): Promise<boolean>
  getEngineName(): 'postgres' | 'sqlite-fallback'
}

let dbInstance: DatabaseClient | null = null

class PostgresClient implements DatabaseClient {
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('supabase') || connectionString.includes('neon')
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }

  async query<T = any>(sqlText: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
    const res = await this.pool.query(sqlText, params)
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? res.rows.length,
    }
  }

  async close(): Promise<void> {
    await this.pool.end()
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await this.pool.query('SELECT 1 as healthy')
      return (res.rows?.[0] as any)?.healthy === 1
    } catch {
      return false
    }
  }

  getEngineName(): 'postgres' {
    return 'postgres'
  }
}

// Resilient memory/file storage client for local zero-dependency development & testing
class FallbackSqliteClient implements DatabaseClient {
  private tables: {
    users: Map<string, any>
    symbols: Map<string, any>
    watchlists: Map<string, any>
    watchlist_items: Map<string, any>
    market_snapshots: any[]
    user_symbol_state: Map<string, any>
  }
  private dataDir: string
  private dataFilePath: string

  constructor() {
    this.dataDir = path.resolve(process.cwd(), '.data')
    this.dataFilePath = path.join(this.dataDir, 'pulse_storage.json')
    this.tables = {
      users: new Map(),
      symbols: new Map(),
      watchlists: new Map(),
      watchlist_items: new Map(),
      market_snapshots: [],
      user_symbol_state: new Map(),
    }
    this.load()
  }

  private load() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf8')
        const parsed = JSON.parse(raw)
        if (parsed.users) parsed.users.forEach((u: any) => this.tables.users.set(u.id, u))
        if (parsed.symbols) parsed.symbols.forEach((s: any) => this.tables.symbols.set(s.symbol, s))
        if (parsed.watchlists) parsed.watchlists.forEach((w: any) => this.tables.watchlists.set(w.id, w))
        if (parsed.watchlist_items) parsed.watchlist_items.forEach((wi: any) => this.tables.watchlist_items.set(wi.id, wi))
        if (parsed.market_snapshots) this.tables.market_snapshots = parsed.market_snapshots
        if (parsed.user_symbol_state) parsed.user_symbol_state.forEach((uss: any) => this.tables.user_symbol_state.set(uss.id, uss))
      }
    } catch (e) {
      console.warn('Could not load local fallback database file, using memory storage:', e)
    }
  }

  private save() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }
      const data = {
        users: Array.from(this.tables.users.values()),
        symbols: Array.from(this.tables.symbols.values()),
        watchlists: Array.from(this.tables.watchlists.values()),
        watchlist_items: Array.from(this.tables.watchlist_items.values()),
        market_snapshots: this.tables.market_snapshots,
        user_symbol_state: Array.from(this.tables.user_symbol_state.values()),
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8')
    } catch (e) {
      console.warn('Could not persist local fallback database:', e)
    }
  }

  async query<T = any>(sqlText: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    // Strip comments
    const cleanSql = sqlText
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    const upper = cleanSql.toUpperCase()

    // 1. SELECT 1 as healthy
    if (upper.includes('SELECT 1') || upper === 'SELECT 1 AS HEALTHY') {
      return { rows: [{ healthy: 1 }] as any, rowCount: 1 }
    }

    // 2. CREATE TABLE / CREATE INDEX (no-op in fallback memory store)
    if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX')) {
      return { rows: [], rowCount: 0 }
    }

    // 3. INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      // params: [id, auth_provider_id, email, password_hash, created_at, updated_at]
      const user = {
        id: params[0],
        auth_provider_id: params[1],
        email: params[2],
        password_hash: params[3],
        created_at: params[4] || new Date().toISOString(),
        updated_at: params[5] || new Date().toISOString(),
      }
      this.tables.users.set(user.id, user)
      this.save()
      return { rows: [user] as any, rowCount: 1 }
    }

    // 4. SELECT FROM users
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS')) {
      let users = Array.from(this.tables.users.values())
      if (upper.includes('WHERE ID = $1')) {
        users = users.filter(u => u.id === params[0])
      } else if (upper.includes('WHERE EMAIL = $1')) {
        users = users.filter(u => u.email.toLowerCase() === (params[0] || '').toLowerCase())
      } else if (upper.includes('WHERE AUTH_PROVIDER_ID = $1')) {
        users = users.filter(u => u.auth_provider_id === params[0])
      }
      return { rows: users as any, rowCount: users.length }
    }

    // 5. INSERT INTO symbols / ON CONFLICT
    if (upper.startsWith('INSERT INTO SYMBOLS')) {
      const sym = {
        symbol: params[0],
        name: params[1],
        exchange: params[2],
        currency: params[3] || 'INR',
        created_at: new Date().toISOString(),
      }
      this.tables.symbols.set(sym.symbol, sym)
      this.save()
      return { rows: [sym] as any, rowCount: 1 }
    }

    // 6. SELECT FROM symbols
    if (upper.startsWith('SELECT') && upper.includes('FROM SYMBOLS')) {
      let syms = Array.from(this.tables.symbols.values())
      if (upper.includes('WHERE SYMBOL = $1')) {
        syms = syms.filter(s => s.symbol === params[0])
      } else if (upper.includes('WHERE SYMBOL ILIKE $1') || upper.includes('LIKE')) {
        const query = (params[0] || '').replace(/%/g, '').toLowerCase()
        syms = syms.filter(s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query))
      }
      return { rows: syms as any, rowCount: syms.length }
    }

    // 7. INSERT INTO watchlists
    if (upper.startsWith('INSERT INTO WATCHLISTS')) {
      const wl = {
        id: params[0],
        user_id: params[1],
        name: params[2],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      this.tables.watchlists.set(wl.id, wl)
      this.save()
      return { rows: [wl] as any, rowCount: 1 }
    }

    // 8. SELECT FROM watchlists
    if (upper.startsWith('SELECT') && upper.includes('FROM WATCHLISTS')) {
      let list = Array.from(this.tables.watchlists.values())
      if (upper.includes('WHERE USER_ID = $1 AND ID = $2')) {
        list = list.filter(w => w.user_id === params[0] && w.id === params[1])
      } else if (upper.includes('WHERE USER_ID = $1')) {
        list = list.filter(w => w.user_id === params[0])
      } else if (upper.includes('WHERE ID = $1')) {
        list = list.filter(w => w.id === params[0])
      }
      return { rows: list as any, rowCount: list.length }
    }

    // 9. DELETE FROM watchlists
    if (upper.startsWith('DELETE FROM WATCHLISTS')) {
      if (upper.includes('WHERE USER_ID = $1 AND ID = $2')) {
        const key = params[1]
        const wl = this.tables.watchlists.get(key)
        if (wl && wl.user_id === params[0]) {
          this.tables.watchlists.delete(key)
          // also cascade delete items
          for (const [itemId, item] of this.tables.watchlist_items.entries()) {
            if (item.watchlist_id === key) this.tables.watchlist_items.delete(itemId)
          }
          this.save()
          return { rows: [], rowCount: 1 }
        }
      }
      return { rows: [], rowCount: 0 }
    }

    // 10. INSERT INTO watchlist_items
    if (upper.startsWith('INSERT INTO WATCHLIST_ITEMS')) {
      const item = {
        id: params[0],
        watchlist_id: params[1],
        symbol: params[2].toUpperCase(),
        created_at: new Date().toISOString(),
      }
      // Check duplicate
      const existing = Array.from(this.tables.watchlist_items.values()).find(
        wi => wi.watchlist_id === item.watchlist_id && wi.symbol === item.symbol
      )
      if (!existing) {
        this.tables.watchlist_items.set(item.id, item)
        this.save()
        return { rows: [item] as any, rowCount: 1 }
      }
      return { rows: [existing] as any, rowCount: 1 }
    }

    // 11. SELECT FROM watchlist_items
    if (upper.startsWith('SELECT') && upper.includes('FROM WATCHLIST_ITEMS')) {
      let items = Array.from(this.tables.watchlist_items.values())
      if (upper.includes('WHERE WATCHLIST_ID = $1')) {
        items = items.filter(wi => wi.watchlist_id === params[0])
      }
      return { rows: items as any, rowCount: items.length }
    }

    // 12. DELETE FROM watchlist_items
    if (upper.startsWith('DELETE FROM WATCHLIST_ITEMS')) {
      if (upper.includes('WHERE WATCHLIST_ID = $1 AND SYMBOL = $2')) {
        let deleted = 0
        for (const [id, item] of this.tables.watchlist_items.entries()) {
          if (item.watchlist_id === params[0] && item.symbol === params[1].toUpperCase()) {
            this.tables.watchlist_items.delete(id)
            deleted++
          }
        }
        this.save()
        return { rows: [], rowCount: deleted }
      }
    }

    // 13. INSERT INTO market_snapshots
    if (upper.startsWith('INSERT INTO MARKET_SNAPSHOTS')) {
      const snap = {
        id: params[0],
        symbol: params[1].toUpperCase(),
        price: Number(params[2]),
        volume: params[3] !== undefined && params[3] !== null ? Number(params[3]) : null,
        source: params[4],
        source_timestamp: params[5],
        received_timestamp: params[6],
        created_at: new Date().toISOString(),
      }
      this.tables.market_snapshots.push(snap)
      this.save()
      return { rows: [snap] as any, rowCount: 1 }
    }

    // 14. SELECT FROM market_snapshots
    if (upper.startsWith('SELECT') && upper.includes('FROM MARKET_SNAPSHOTS')) {
      let snaps = [...this.tables.market_snapshots]
      if (upper.includes('WHERE SYMBOL = $1 AND SOURCE_TIMESTAMP >= $2 AND SOURCE_TIMESTAMP <= $3')) {
        snaps = snaps.filter(
          s => s.symbol === params[0] &&
            new Date(s.source_timestamp) >= new Date(params[1]) &&
            new Date(s.source_timestamp) <= new Date(params[2])
        )
      } else if (upper.includes('WHERE SYMBOL = $1 AND SOURCE_TIMESTAMP <= $2')) {
        snaps = snaps.filter(
          s => s.symbol === params[0] && new Date(s.source_timestamp) <= new Date(params[1])
        )
      } else if (upper.includes('WHERE SYMBOL = $1')) {
        snaps = snaps.filter(s => s.symbol === params[0])
      }

      // Sort by source_timestamp
      if (upper.includes('ORDER BY SOURCE_TIMESTAMP DESC')) {
        snaps.sort((a, b) => new Date(b.source_timestamp).getTime() - new Date(a.source_timestamp).getTime())
      } else if (upper.includes('ORDER BY SOURCE_TIMESTAMP ASC') || upper.includes('ORDER BY SOURCE_TIMESTAMP')) {
        snaps.sort((a, b) => new Date(a.source_timestamp).getTime() - new Date(b.source_timestamp).getTime())
      }

      // LIMIT
      if (upper.includes('LIMIT 1') || upper.includes('LIMIT $2') || upper.includes('LIMIT $4')) {
        const limit = upper.includes('LIMIT 1') ? 1 : (params[params.length - 1] || 1)
        snaps = snaps.slice(0, limit)
      }

      return { rows: snaps as any, rowCount: snaps.length }
    }

    // 15. INSERT INTO user_symbol_state / ON CONFLICT
    if (upper.startsWith('INSERT INTO USER_SYMBOL_STATE')) {
      const state = {
        id: params[0],
        user_id: params[1],
        symbol: params[2].toUpperCase(),
        last_seen_timestamp: params[3],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      // Check existing by (user_id, symbol)
      let foundKey: string | null = null
      for (const [id, s] of this.tables.user_symbol_state.entries()) {
        if (s.user_id === state.user_id && s.symbol === state.symbol) {
          foundKey = id
          break
        }
      }
      if (foundKey) {
        const existing = this.tables.user_symbol_state.get(foundKey)
        // Guard out-of-order: new last_seen must be >= existing
        if (new Date(state.last_seen_timestamp) >= new Date(existing.last_seen_timestamp)) {
          existing.last_seen_timestamp = state.last_seen_timestamp
          existing.updated_at = new Date().toISOString()
          this.tables.user_symbol_state.set(foundKey, existing)
        }
        this.save()
        return { rows: [existing] as any, rowCount: 1 }
      } else {
        this.tables.user_symbol_state.set(state.id, state)
        this.save()
        return { rows: [state] as any, rowCount: 1 }
      }
    }

    // 16. SELECT FROM user_symbol_state
    if (upper.startsWith('SELECT') && upper.includes('FROM USER_SYMBOL_STATE')) {
      let states = Array.from(this.tables.user_symbol_state.values())
      if (upper.includes('WHERE USER_ID = $1 AND SYMBOL = $2')) {
        states = states.filter(s => s.user_id === params[0] && s.symbol === params[1].toUpperCase())
      } else if (upper.includes('WHERE USER_ID = $1')) {
        states = states.filter(s => s.user_id === params[0])
      }
      return { rows: states as any, rowCount: states.length }
    }

    // 17. UPDATE user_symbol_state
    if (upper.startsWith('UPDATE USER_SYMBOL_STATE')) {
      let updatedCount = 0
      const nowTs = params[0] // $1 last_seen
      const userId = params[1] // $2 user_id

      for (const [id, s] of this.tables.user_symbol_state.entries()) {
        if (s.user_id === userId) {
          if (upper.includes('SYMBOL = $3')) {
            if (s.symbol === params[2].toUpperCase()) {
              if (new Date(nowTs) >= new Date(s.last_seen_timestamp)) {
                s.last_seen_timestamp = nowTs
                s.updated_at = new Date().toISOString()
                updatedCount++
              }
            }
          } else {
            // Update all
            if (new Date(nowTs) >= new Date(s.last_seen_timestamp)) {
              s.last_seen_timestamp = nowTs
              s.updated_at = new Date().toISOString()
              updatedCount++
            }
          }
        }
      }
      this.save()
      return { rows: [], rowCount: updatedCount }
    }

    console.warn('Unhandled SQL in Fallback Database Client:', sqlText)
    return { rows: [], rowCount: 0 }
  }

  async close(): Promise<void> {
    this.save()
  }

  async isHealthy(): Promise<boolean> {
    return true
  }

  getEngineName(): 'sqlite-fallback' {
    return 'sqlite-fallback'
  }
}

export function getDb(): DatabaseClient {
  if (dbInstance) {
    return dbInstance
  }

  const connectionString = process.env.DATABASE_URL

  if (connectionString && !connectionString.includes('localhost:5432/growwpulse')) {
    try {
      dbInstance = new PostgresClient(connectionString)
      return dbInstance
    } catch (e) {
      console.warn('Failed to initialize PostgreSQL pool, falling back to local storage engine:', e)
    }
  }

  // Use resilient zero-config engine for tests/local execution
  dbInstance = new FallbackSqliteClient()
  return dbInstance
}

export async function runQuery<T = any>(sqlText: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const db = getDb()
  return db.query<T>(sqlText, params)
}
