import { describe, it, expect, beforeEach } from 'vitest'
import { MarketSnapshotService } from '@/lib/services/market-snapshot.service'
import { runMigrations } from '@/lib/db/migrate'

describe('Phase 3 & 4: Market Data Ingestion & Snapshot Pipeline', () => {
  beforeEach(async () => {
    await runMigrations()
  })

  it('should persist market observations with source and received timestamps', async () => {
    const obsTime = new Date('2026-09-05T09:30:00Z').toISOString()
    const recTime = new Date('2026-09-05T09:30:01Z').toISOString()

    const snapshot = await MarketSnapshotService.persistSnapshot({
      symbol: 'RELIANCE',
      price: 2950.50,
      volume: 125000,
      source: 'TestMarketProvider',
      sourceTimestamp: obsTime,
      receivedTimestamp: recTime,
    })

    expect(snapshot.id).toBeDefined()
    expect(snapshot.symbol).toBe('RELIANCE')
    expect(Number(snapshot.price)).toBe(2950.50)
    expect(snapshot.source_timestamp).toBe(obsTime)
    expect(snapshot.received_timestamp).toBe(recTime)
  })

  it('should query snapshots by time range in strict ascending source timestamp order', async () => {
    const sym = `INFY_TEST_${Date.now()}`
    const t1 = new Date('2026-09-05T10:00:00Z').toISOString()
    const t2 = new Date('2026-09-05T10:15:00Z').toISOString()
    const t3 = new Date('2026-09-05T10:30:00Z').toISOString()

    // Insert out of order
    await MarketSnapshotService.persistSnapshot({ symbol: sym, price: 1810, volume: 1000, source: 'Test', sourceTimestamp: t2, receivedTimestamp: t2 })
    await MarketSnapshotService.persistSnapshot({ symbol: sym, price: 1800, volume: 1000, source: 'Test', sourceTimestamp: t1, receivedTimestamp: t1 })
    await MarketSnapshotService.persistSnapshot({ symbol: sym, price: 1825, volume: 1000, source: 'Test', sourceTimestamp: t3, receivedTimestamp: t3 })

    const snapshots = await MarketSnapshotService.getSnapshotsByRange(
      sym,
      new Date('2026-09-05T09:59:00Z'),
      new Date('2026-09-05T10:31:00Z')
    )

    expect(snapshots.length).toBe(3)
    expect(snapshots[0].source_timestamp).toBe(t1)
    expect(snapshots[1].source_timestamp).toBe(t2)
    expect(snapshots[2].source_timestamp).toBe(t3)
    expect(Number(snapshots[0].price)).toBe(1800)
    expect(Number(snapshots[2].price)).toBe(1825)
  })
})
