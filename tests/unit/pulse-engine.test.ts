import { describe, it, expect } from 'vitest'
import { PulseEngine } from '@/lib/pulse/engine'
import { defaultPulseConfig } from '@/lib/pulse/config'
import { HistoricalObservation } from '@/lib/market/types'

describe('Phase 5: Pure Pulse Analytics Engine', () => {
  const baseTime = new Date('2026-09-05T09:15:00Z').getTime()

  // Generate synthetic clean historical observations (every 15m)
  function createObservations(symbol: string, prices: number[]): HistoricalObservation[] {
    return prices.map((price, idx) => ({
      symbol,
      price,
      volume: 50000 + (idx % 3) * 10000,
      source: 'TestProvider',
      sourceTimestamp: new Date(baseTime + idx * 15 * 60 * 1000).toISOString(),
      receivedTimestamp: new Date(baseTime + idx * 15 * 60 * 1000 + 1000).toISOString(),
    }))
  }

  it('should compute returns, volatility, interval scaling, and unusualness accurately', () => {
    // Generate 20 baseline points with low ~0.3% volatility
    const prices = [
      1000, 1003, 1001, 1004, 1002, 1005, 1003, 1006, 1004, 1007,
      1005, 1008, 1006, 1009, 1007, 1010, 1008, 1011, 1009, 1010,
      // Then a sudden drop to 960 (-5.0%) over 1 hour
      990, 975, 965, 960
    ]

    const obs = createObservations('RELIANCE', prices)
    const refTime = new Date(baseTime + 19 * 15 * 60 * 1000) // index 19 (price 1010)
    const evalTime = new Date(baseTime + 23 * 15 * 60 * 1000) // index 23 (price 960, 1h later)

    const event = PulseEngine.evaluateSymbol('RELIANCE', refTime, evalTime, obs)

    expect(event.symbol).toBe('RELIANCE')
    expect(event.referencePrice).toBe(1010)
    expect(event.evaluationPrice).toBe(960)
    expect(event.returnPercent).toBeCloseTo(-4.95, 1)
    expect(event.unusualness).toBeGreaterThan(2.0)
    expect(event.confidence).toBe('HIGH')
    expect(event.attentionLevel).toBe('HIGH_ATTENTION')
    expect(event.explanation).toContain('fell')
    expect(event.whySurfaced).toContain('significantly larger')
  })

  it('should scale expected volatility with interval duration sqrt(N)', () => {
    const prices = [
      100, 101, 100, 102, 101, 103, 102, 104, 103, 105,
      104, 106, 105, 107, 106, 108, 107, 109, 108, 110,
      110, 110
    ]
    const obs = createObservations('TCS', prices)

    // Interval 1: 15 minutes (N=1)
    const refTime1 = new Date(baseTime + 19 * 15 * 60 * 1000)
    const evalTime1 = new Date(baseTime + 20 * 15 * 60 * 1000)
    const res1 = PulseEngine.evaluateSymbol('TCS', refTime1, evalTime1, obs)

    // Interval 2: 60 minutes (N=4) -> sqrt(4) = 2x expected movement
    const evalTime2 = new Date(baseTime + (19 + 4) * 15 * 60 * 1000)
    const res2 = PulseEngine.evaluateSymbol('TCS', refTime1, evalTime2, obs)

    expect(res2.expectedMovement).toBeGreaterThan(res1.expectedMovement)
    expect(res2.expectedMovement / res1.expectedMovement).toBeCloseTo(2.0, 1)
  })

  it('should honestly report INSUFFICIENT confidence when data is scarce', () => {
    // Only 2 data points
    const obs = createObservations('NEW_STOCK', [500, 520])
    const refTime = new Date(baseTime)
    const evalTime = new Date(baseTime + 15 * 60 * 1000)

    const event = PulseEngine.evaluateSymbol('NEW_STOCK', refTime, evalTime, obs)

    expect(event.confidence).toBe('INSUFFICIENT')
    expect(event.unusualness).toBe(0)
    expect(event.explanation).toContain('Not enough historical data')
  })

  it('should rank events deterministically by attention level and unusualness', () => {
    const map = new Map<string, HistoricalObservation[]>()

    // Stock A: High attention drop (-5%)
    map.set('RELIANCE', createObservations('RELIANCE', [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      95
    ]))

    // Stock B: Normal movement (100 -> 100.1)
    map.set('TCS', createObservations('TCS', [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      100.1
    ]))

    // Stock C: Watch movement (+1.5%)
    map.set('INFY', createObservations('INFY', [
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
      101.5
    ]))

    const refTime = new Date(baseTime + 19 * 15 * 60 * 1000)
    const evalTime = new Date(baseTime + 20 * 15 * 60 * 1000)

    const result = PulseEngine.evaluateWatchlist(refTime, evalTime, map)

    expect(result.summary.totalStocks).toBe(3)
    expect(result.summary.attentionCount).toBeGreaterThanOrEqual(1)
    expect(result.rankedEvents[0].symbol).toBe('RELIANCE')
    expect(result.normalEvents.some(e => e.symbol === 'TCS')).toBe(true)
  })
})
