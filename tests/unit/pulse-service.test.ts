import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from '@/lib/auth/service'
import { WatchlistService } from '@/lib/watchlists/service'
import { MarketSnapshotService } from '@/lib/services/market-snapshot.service'
import { SeenService } from '@/lib/services/seen.service'
import { PulseService } from '@/lib/services/pulse.service'
import { runMigrations } from '@/lib/db/migrate'

describe('Phase 6, 7, 10, 11: Pulse Service, Last-Seen State & Replay', () => {
  beforeEach(async () => {
    await runMigrations()
  })

  it('should run live pulse, mark seen, and persist temporal acknowledgement', async () => {
    // 1. Create User
    const { user } = await AuthService.signup(`pulse_user_${Date.now()}@groww.in`, 'pulse123')
    const watchlists = await WatchlistService.getWatchlistsForUser(user.id)
    const wl = watchlists[0]

    // 2. Add symbols
    const sym = `SYM_${Date.now()}`
    await WatchlistService.addSymbolToWatchlist(wl.id, user.id, sym)

    // 3. Add historical snapshots for this symbol
    const baseTime = Date.now() - 4 * 60 * 60 * 1000
    for (let i = 0; i < 20; i++) {
      await MarketSnapshotService.persistSnapshot({
        symbol: sym,
        price: 1000 + i,
        volume: 5000,
        source: 'TestFeed',
        sourceTimestamp: new Date(baseTime + i * 15 * 60 * 1000).toISOString(),
        receivedTimestamp: new Date(baseTime + i * 15 * 60 * 1000 + 1000).toISOString(),
      })
    }

    // 4. Generate Live Pulse
    const pulse1 = await PulseService.getLivePulse({ userId: user.id })
    expect(pulse1.summary.totalStocks).toBeGreaterThanOrEqual(1)
    expect(pulse1.events.some(e => e.symbol === sym)).toBe(true)

    // 5. Mark seen for symbol
    const seenRes = await SeenService.markSymbolSeen(user.id, sym)
    expect(seenRes.success).toBe(true)

    // 6. Verify last-seen updated
    const lastSeenMap = await SeenService.getLastSeenMap(user.id)
    expect(lastSeenMap.has(sym)).toBe(true)

    // 7. Mark all seen
    const allSeenRes = await SeenService.markAllSeen(user.id, wl.id)
    expect(allSeenRes.success).toBe(true)

    // 8. Replay with identical pulse engine
    const replayRes = await PulseService.getReplayPulse({
      userId: user.id,
      watchlistId: wl.id,
      referenceTime: new Date(baseTime),
      evaluationTime: new Date(baseTime + 3 * 60 * 60 * 1000),
    })
    expect(replayRes.summary.totalStocks).toBeGreaterThanOrEqual(1)
    expect(replayRes.events.length).toBeGreaterThanOrEqual(1)
  })
})
