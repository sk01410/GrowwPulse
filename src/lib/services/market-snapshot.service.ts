import { getDb } from '@/lib/db'
import { getMarketDataProvider } from '@/lib/market/provider'
import { HistoricalObservation, MarketQuote } from '@/lib/market/types'

export interface MarketSnapshotRecord {
  id: string
  symbol: string
  price: number
  volume: number | null
  source: string
  source_timestamp: string
  received_timestamp: string
  created_at: string
}

export class MarketSnapshotService {
  /**
   * Persists a market observation snapshot with strict out-of-order protection.
   * Section 20, 22: Older observations cannot overwrite newer observations.
   */
  static async persistSnapshot(observation: HistoricalObservation): Promise<MarketSnapshotRecord> {
    const db = getDb()
    const id = `snp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    const symbol = observation.symbol.toUpperCase()

    const res = await db.query<MarketSnapshotRecord>(
      `INSERT INTO market_snapshots (id, symbol, price, volume, source, source_timestamp, received_timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        symbol,
        observation.price,
        observation.volume,
        observation.source,
        observation.sourceTimestamp,
        observation.receivedTimestamp || now,
        now,
      ]
    )

    return res.rows[0] || {
      id,
      symbol,
      price: observation.price,
      volume: observation.volume,
      source: observation.source,
      source_timestamp: observation.sourceTimestamp,
      received_timestamp: observation.receivedTimestamp || now,
      created_at: now,
    }
  }

  /**
   * Batch persists historical observations.
   */
  static async persistBatchSnapshots(observations: HistoricalObservation[]): Promise<number> {
    let count = 0
    for (const obs of observations) {
      await this.persistSnapshot(obs)
      count++
    }
    return count
  }

  /**
   * Fetches latest quote from provider and persists as a shared snapshot.
   */
  static async syncQuote(symbol: string): Promise<MarketQuote> {
    const provider = getMarketDataProvider()
    const quote = await provider.getQuote(symbol)

    await this.persistSnapshot({
      symbol: quote.symbol,
      price: quote.price,
      volume: quote.volume,
      source: quote.source,
      sourceTimestamp: quote.sourceTimestamp,
      receivedTimestamp: quote.receivedTimestamp,
    })

    return quote
  }

  /**
   * Ingests real historical observations from provider and stores in PostgreSQL.
   */
  static async syncHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
    interval: '5m' | '15m' | '1h' | '1d' = '15m'
  ): Promise<HistoricalObservation[]> {
    const provider = getMarketDataProvider()
    const observations = await provider.getHistoricalData(symbol, from, to, interval)
    if (observations.length > 0) {
      await this.persistBatchSnapshots(observations)
    }
    return observations
  }

  /**
   * Retrieves stored snapshots for a symbol within a time window [from, to], ordered by source_timestamp ASC.
   */
  static async getSnapshotsByRange(
    symbol: string,
    from: Date,
    to: Date
  ): Promise<MarketSnapshotRecord[]> {
    const db = getDb()
    const res = await db.query<MarketSnapshotRecord>(
      `SELECT * FROM market_snapshots
       WHERE symbol = $1 AND source_timestamp >= $2 AND source_timestamp <= $3
       ORDER BY source_timestamp ASC`,
      [symbol.toUpperCase(), from.toISOString(), to.toISOString()]
    )
    return res.rows
  }

  /**
   * Retrieves the latest snapshot stored on or before a given timestamp.
   */
  static async getLatestSnapshotAtOrBefore(
    symbol: string,
    timestamp: Date
  ): Promise<MarketSnapshotRecord | null> {
    const db = getDb()
    const res = await db.query<MarketSnapshotRecord>(
      `SELECT * FROM market_snapshots
       WHERE symbol = $1 AND source_timestamp <= $2
       ORDER BY source_timestamp DESC
       LIMIT 1`,
      [symbol.toUpperCase(), timestamp.toISOString()]
    )
    return res.rows[0] || null
  }

  /**
   * Checks whether the latest snapshot is fresh or stale.
   * Section 21: Data freshness threshold (default 15 minutes during market hours).
   */
  static isFresh(sourceTimestamp: string, maxAgeMinutes: number = 15): boolean {
    const obsTime = new Date(sourceTimestamp).getTime()
    const now = Date.now()
    const ageMinutes = (now - obsTime) / (1000 * 60)
    return ageMinutes <= maxAgeMinutes
  }
}
