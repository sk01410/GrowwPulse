import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from '@/lib/auth/service'
import { WatchlistService } from '@/lib/watchlists/service'
import { MarketSnapshotService } from '@/lib/services/market-snapshot.service'
import { SeenService } from '@/lib/services/seen.service'
import { PulseService } from '@/lib/services/pulse.service'
import { runMigrations } from '@/lib/db/migrate'

describe('Critical User Journey & Demo Acceptance (Section 79 & 181)', () => {
  beforeEach(async () => {
    await runMigrations()
  })

  it('executes full critical journey: Signup -> Watchlist -> Live Market -> Pulse -> Detail -> Mark Seen -> Catchup -> Replay', async () => {
    // 1. Sign up user
    const email = `investor_${Date.now()}@groww.in`
    const { user, token } = await AuthService.signup(email, 'SecurePulse2026!')
    expect(user.id).toBeDefined()
    expect(user.email).toBe(email)

    // 2. Create and select watchlist
    const watchlist = await WatchlistService.createWatchlist(user.id, 'India Large Cap')
    expect(watchlist.id).toBeDefined()

    // 3. Add stocks to watchlist
    const sym1 = `RELIANCE_${Date.now()}`
    const sym2 = `TCS_${Date.now()}`
    const sym3 = `INFY_${Date.now()}`

    await WatchlistService.addSymbolToWatchlist(watchlist.id, user.id, sym1)
    await WatchlistService.addSymbolToWatchlist(watchlist.id, user.id, sym2)
    await WatchlistService.addSymbolToWatchlist(watchlist.id, user.id, sym3)

    // 4. Ingest real persisted historical observations
    const baseTime = Date.now() - 6 * 60 * 60 * 1000 // 6 hours ago
    for (let i = 0; i < 24; i++) {
      const ts = new Date(baseTime + i * 15 * 60 * 1000).toISOString()
      const rec = new Date(baseTime + i * 15 * 60 * 1000 + 1000).toISOString()

      // Stock 1: Drop -5% during last hour (Unusual move)
      const p1 = i >= 20 ? 2850 - (i - 20) * 35 : 3000 + (i % 2) * 5
      await MarketSnapshotService.persistSnapshot({
        symbol: sym1,
        price: p1,
        volume: 100000,
        source: 'NSEFeed',
        sourceTimestamp: ts,
        receivedTimestamp: rec,
      })

      // Stock 2: Normal stable move
      const p2 = 3800 + (i % 3) * 2
      await MarketSnapshotService.persistSnapshot({
        symbol: sym2,
        price: p2,
        volume: 50000,
        source: 'NSEFeed',
        sourceTimestamp: ts,
        receivedTimestamp: rec,
      })

      // Stock 3: Normal stable move
      const p3 = 1850 + (i % 2) * 1
      await MarketSnapshotService.persistSnapshot({
        symbol: sym3,
        price: p3,
        volume: 40000,
        source: 'NSEFeed',
        sourceTimestamp: ts,
        receivedTimestamp: rec,
      })
    }

    // 5. Establish last-seen state 2 hours ago (index 16)
    const refTimestamp = new Date(baseTime + 16 * 15 * 60 * 1000).toISOString()
    const db = (await import('@/lib/db')).getDb()
    await db.query('UPDATE user_symbol_state SET last_seen_timestamp = $1 WHERE user_id = $2', [refTimestamp, user.id])

    // 6. Generate Live Pulse
    const pulse = await PulseService.getLivePulse({
      userId: user.id,
      watchlistId: watchlist.id,
    })

    // 7. Verify dynamic summary: {N} moved, {M} deserve attention
    expect(pulse.summary.totalStocks).toBe(3)
    expect(pulse.summary.movedCount).toBeGreaterThanOrEqual(1)
    expect(pulse.summary.attentionCount).toBeGreaterThanOrEqual(1)

    // 8. Verify highest ranked event
    const topEvent = pulse.rankedEvents[0]
    expect(topEvent.symbol).toBe(sym1)
    expect(topEvent.attentionLevel).toBe('HIGH_ATTENTION')
    expect(topEvent.unusualness).toBeGreaterThan(2.0)
    expect(topEvent.confidence).toBe('HIGH')
    expect(topEvent.explanation).toContain('fell')
    expect(topEvent.provenance.source).toBe('NSEFeed')

    // 9. Mark top event as seen
    const markRes = await SeenService.markSymbolSeen(user.id, sym1)
    expect(markRes.success).toBe(true)

    // 10. Mark all remaining as seen
    const markAllRes = await SeenService.markAllSeen(user.id, watchlist.id)
    expect(markAllRes.success).toBe(true)

    // 11. Run Historical Replay with identical Pulse Engine
    const replay = await PulseService.getReplayPulse({
      userId: user.id,
      watchlistId: watchlist.id,
      referenceTime: new Date(baseTime),
      evaluationTime: new Date(baseTime + 4 * 60 * 60 * 1000),
    })

    expect(replay.summary.totalStocks).toBe(3)
    expect(replay.events.length).toBe(3)
  })
})
