import { describe, it, expect } from 'vitest'
import { getDb } from '@/lib/db'
import { runMigrations } from '@/lib/db/migrate'

describe('Phase 0: Database & Project Foundation', () => {
  it('should initialize database and run schema migrations', async () => {
    const res = await runMigrations()
    expect(res.success).toBe(true)

    const db = getDb()
    const healthy = await db.isHealthy()
    expect(healthy).toBe(true)

    const symbolsRes = await db.query('SELECT * FROM symbols WHERE symbol = $1', ['RELIANCE'])
    expect(symbolsRes.rows.length).toBe(1)
    expect(symbolsRes.rows[0].symbol).toBe('RELIANCE')
  })
})
