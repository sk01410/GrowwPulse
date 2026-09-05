import { WatchlistService } from '@/lib/watchlists/service'
import { SeenService } from './seen.service'
import { AuthService } from '@/lib/auth/service'
import { MarketSnapshotService } from './market-snapshot.service'
import { PulseEngine, PulseEngineResult, PulseEvent, SymbolExtraContext } from '@/lib/pulse/engine'
import { HistoricalObservation } from '@/lib/market/types'
import { defaultPulseConfig, PulseConfig } from '@/lib/pulse/config'
import { NewsService } from '@/lib/news/news.service'
import { SectorService } from '@/lib/market/sector.service'

export interface LivePulseRequest {
  userId: string
  watchlistId?: string
  config?: PulseConfig
}

export interface ReplayPulseRequest {
  userId: string
  watchlistId?: string
  referenceTime: Date
  evaluationTime: Date
  config?: PulseConfig
}

export class PulseService {
  /**
   * Generates Live Pulse for authenticated user.
   * Section 27, 49, 91:
   * 1. Load active watchlist
   * 2. Load user's last_seen_timestamps & login session
   * 3. Sync latest market observations
   * 4. Retrieve historical lookback + interval snapshots
   * 5. Run deterministic Pulse Engine
   */
  static async getLivePulse(params: LivePulseRequest): Promise<PulseEngineResult> {
    const { userId, watchlistId, config = defaultPulseConfig } = params

    // 1. Get user watchlists & symbols
    const watchlists = await WatchlistService.getWatchlistsForUser(userId)
    if (watchlists.length === 0) {
      const now = new Date()
      return {
        summary: {
          awayDurationMinutes: 0,
          referenceTime: now.toISOString(),
          evaluationTime: now.toISOString(),
          totalStocks: 0,
          movedCount: 0,
          attentionCount: 0,
        },
        events: [],
        rankedEvents: [],
        normalEvents: [],
      }
    }

    const targetWl = watchlistId
      ? watchlists.find(w => w.id === watchlistId) || watchlists[0]
      : watchlists[0]

    const symbols = (targetWl.items || []).map(i => i.symbol.toUpperCase())
    if (symbols.length === 0) {
      const now = new Date()
      return {
        summary: {
          awayDurationMinutes: 0,
          referenceTime: now.toISOString(),
          evaluationTime: now.toISOString(),
          totalStocks: 0,
          movedCount: 0,
          attentionCount: 0,
        },
        events: [],
        rankedEvents: [],
        normalEvents: [],
      }
    }

    // 2. Get last-seen state
    const lastSeenMap = await SeenService.getLastSeenMap(userId)
    const now = new Date()

    // Determine oldest lastSeen across watchlist symbols to define interval window
    let earliestLastSeenTime = now.getTime()
    for (const sym of symbols) {
      const ts = lastSeenMap.get(sym)
      if (ts) {
        const t = new Date(ts).getTime()
        if (t < earliestLastSeenTime) earliestLastSeenTime = t
      } else {
        // If never seen, default to 4 hours ago for initial rich evaluation
        const initialLookback = now.getTime() - (4 * 60 * 60 * 1000)
        if (initialLookback < earliestLastSeenTime) earliestLastSeenTime = initialLookback
      }
    }

    // Reference time is the lastSeen timestamp (clamped to at least 15m ago)
    const minLookbackTime = now.getTime() - (15 * 60 * 1000)
    const referenceTime = new Date(Math.min(earliestLastSeenTime, minLookbackTime))
    const evaluationTime = now

    // 3. For each symbol, fetch live quote & historical observations
    // Baseline lookback: 7 days prior to referenceTime
    const baselineStart = new Date(referenceTime.getTime() - 7 * 24 * 60 * 60 * 1000)
    const symbolObservationsMap = new Map<string, HistoricalObservation[]>()
    const symbolContextsMap = new Map<string, SymbolExtraContext>()

    for (const item of targetWl.items || []) {
      const sym = item.symbol.toUpperCase()
      symbolContextsMap.set(sym, {
        watchReason: item.watch_reason || 'JUST_WATCHING',
        targetPrice: item.target_price !== undefined ? Number(item.target_price) : null,
        mutedUntil: item.muted_until || null,
        portfolioHolding: item.watch_reason === 'OWN_IT' ? 75000 : (item.watch_reason === 'CONSIDERING_BUY' ? 25000 : undefined),
      })
    }

    for (const sym of symbols) {
      try {
        // Sync latest quote
        await MarketSnapshotService.syncQuote(sym).catch(() => null)

        // Query database snapshots
        let snapshots = await MarketSnapshotService.getSnapshotsByRange(sym, baselineStart, evaluationTime)

        // If insufficient history in DB, sync from provider
        if (snapshots.length < config.minimumObservationsForBaseline) {
          try {
            await MarketSnapshotService.syncHistoricalData(sym, baselineStart, evaluationTime, '15m')
            snapshots = await MarketSnapshotService.getSnapshotsByRange(sym, baselineStart, evaluationTime)
          } catch (err) {
            console.warn(`Could not sync live historical data for ${sym}:`, err)
          }
        }

        const observations: HistoricalObservation[] = snapshots.map(s => ({
          symbol: s.symbol,
          price: Number(s.price),
          volume: s.volume !== null ? Number(s.volume) : null,
          source: s.source,
          sourceTimestamp: s.source_timestamp,
          receivedTimestamp: s.received_timestamp,
        }))

        symbolObservationsMap.set(sym, observations)

        // Calculate move % and enrich context
        let movePct = 0
        if (observations.length >= 2) {
          const first = observations[0].price
          const last = observations[observations.length - 1].price
          if (first > 0) movePct = ((last - first) / first) * 100
        }
        const sectorContext = SectorService.getSectorContext(sym, movePct)
        const catalyst = await NewsService.getPrimaryCatalyst(sym, movePct)

        const existing = symbolContextsMap.get(sym) || {}
        symbolContextsMap.set(sym, {
          ...existing,
          sectorContext,
          catalyst: catalyst || undefined,
        })
      } catch (err) {
        console.error(`Error processing symbol ${sym} in PulseService:`, err)
        symbolObservationsMap.set(sym, [])
      }
    }

    // Feature #1 & #6: Market Context Benchmark (Nifty 50)
    let marketHeadline: string | undefined = undefined
    try {
      const niftySnapshots = await MarketSnapshotService.getSnapshotsByRange('^NSEI', baselineStart, evaluationTime).catch(() => [])
      if (niftySnapshots.length >= 2) {
        const first = Number(niftySnapshots[0].price)
        const last = Number(niftySnapshots[niftySnapshots.length - 1].price)
        if (first > 0 && last > 0) {
          const niftyReturn = ((last - first) / first) * 100
          marketHeadline = `Nifty moved ${niftyReturn >= 0 ? '+' : ''}${niftyReturn.toFixed(1)}% today.`
        }
      }
    } catch {
      // ignore benchmark error
    }

    // 4. Run Pulse Engine
    return PulseEngine.evaluateWatchlist(
      referenceTime,
      evaluationTime,
      symbolObservationsMap,
      config,
      symbolContextsMap,
      marketHeadline
    )
  }

  /**
   * Generates Replay Pulse for historical exploration.
   * Section 48, 50, 69: Replay MUST use the identical Pulse Engine and real historical snapshots!
   */
  static async getReplayPulse(params: ReplayPulseRequest): Promise<PulseEngineResult> {
    const { userId, watchlistId, referenceTime, evaluationTime, config = defaultPulseConfig } = params

    if (referenceTime >= evaluationTime) {
      throw new Error('referenceTime must be earlier than evaluationTime')
    }

    // 1. Get user's watchlist symbols
    const watchlists = await WatchlistService.getWatchlistsForUser(userId)
    const targetWl = watchlistId
      ? watchlists.find(w => w.id === watchlistId) || watchlists[0]
      : watchlists[0]

    const symbols = (targetWl?.items || []).map(i => i.symbol.toUpperCase())
    const baselineStart = new Date(referenceTime.getTime() - 7 * 24 * 60 * 60 * 1000)
    const symbolObservationsMap = new Map<string, HistoricalObservation[]>()
    const symbolContextsMap = new Map<string, SymbolExtraContext>()

    for (const item of targetWl?.items || []) {
      const sym = item.symbol.toUpperCase()
      symbolContextsMap.set(sym, {
        watchReason: item.watch_reason || 'JUST_WATCHING',
        targetPrice: item.target_price !== undefined ? Number(item.target_price) : null,
        mutedUntil: item.muted_until || null,
        portfolioHolding: item.watch_reason === 'OWN_IT' ? 75000 : (item.watch_reason === 'CONSIDERING_BUY' ? 25000 : undefined),
      })
    }

    for (const sym of symbols) {
      let snapshots = await MarketSnapshotService.getSnapshotsByRange(sym, baselineStart, evaluationTime)

      if (snapshots.length < config.minimumObservationsForBaseline) {
        try {
          const durationDays = (evaluationTime.getTime() - baselineStart.getTime()) / (1000 * 60 * 60 * 24)
          const interval = durationDays > 5 ? '1h' : '15m'
          await MarketSnapshotService.syncHistoricalData(sym, baselineStart, evaluationTime, interval)
          snapshots = await MarketSnapshotService.getSnapshotsByRange(sym, baselineStart, evaluationTime)
        } catch (err) {
          console.warn(`Historical sync error for ${sym} in replay:`, err)
        }
      }

      const observations: HistoricalObservation[] = snapshots.map(s => ({
        symbol: s.symbol,
        price: Number(s.price),
        volume: s.volume !== null ? Number(s.volume) : null,
        source: s.source,
        sourceTimestamp: s.source_timestamp,
        receivedTimestamp: s.received_timestamp,
      }))

      symbolObservationsMap.set(sym, observations)

      // Calculate move % and enrich context
      let movePct = 0
      if (observations.length >= 2) {
        const first = observations[0].price
        const last = observations[observations.length - 1].price
        if (first > 0) movePct = ((last - first) / first) * 100
      }
      const sectorContext = SectorService.getSectorContext(sym, movePct)
      const catalyst = await NewsService.getPrimaryCatalyst(sym, movePct)

      const existing = symbolContextsMap.get(sym) || {}
      symbolContextsMap.set(sym, {
        ...existing,
        sectorContext,
        catalyst: catalyst || undefined,
      })
    }

    // Run identical Pulse Engine
    return PulseEngine.evaluateWatchlist(
      referenceTime,
      evaluationTime,
      symbolObservationsMap,
      config,
      symbolContextsMap
    )
  }
}
