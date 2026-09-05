import { describe, it, expect } from 'vitest'
import { NewsService } from '@/lib/news/news.service'
import { SectorService } from '@/lib/market/sector.service'
import { BacktestService } from '@/lib/pulse/backtest.service'
import { PulseEngine, SymbolExtraContext } from '@/lib/pulse/engine'
import { HistoricalObservation } from '@/lib/market/types'

describe('Intelligence Layer: News Correlation, Sector Divergence, Backtesting & Portfolio Weighting', () => {
  it('NewsService extracts and classifies financial catalysts', async () => {
    const catalyst = await NewsService.getPrimaryCatalyst('RELIANCE', 4.5, 'Reliance Industries Ltd.')
    expect(catalyst).toBeDefined()
    if (catalyst) {
      expect(catalyst.headline).toBeDefined()
      expect(catalyst.category).toBeDefined()
      expect(['EARNINGS', 'MACRO_POLICY', 'SECTOR_FLOW', 'ANALYST_RATING', 'MANAGEMENT', 'MARKET_MOMENTUM']).toContain(catalyst.category)
      expect(catalyst.summary.length).toBeGreaterThan(5)
    }
  })

  it('SectorService calculates idiosyncratic alpha divergence vs sector benchmark', () => {
    // IT Stock test
    const infyContext = SectorService.getSectorContext('INFY', 4.5)
    expect(infyContext.sectorName).toBe('Nifty IT')
    expect(infyContext.benchmarkIndex).toBe('Nifty IT Index')
    expect(infyContext.idiosyncraticDivergence).toBeDefined()
    expect(typeof infyContext.isSectorWide).toBe('boolean')
    expect(infyContext.relativeNarrative).toContain('Nifty IT')

    // Banking Stock test
    const hdfcContext = SectorService.getSectorContext('HDFCBANK', -3.2)
    expect(hdfcContext.sectorName).toBe('Nifty Bank')
    expect(hdfcContext.benchmarkIndex).toBe('Nifty Bank Index')
  })

  it('BacktestService generates quantitative credibility metrics', () => {
    const scorecard = BacktestService.getModelScorecard()
    expect(scorecard.precisionRate).toBeGreaterThan(70)
    expect(scorecard.noiseRejectionRate).toBeGreaterThan(85)
    expect(scorecard.evaluatedAlertsCount).toBeGreaterThan(100)
    expect(scorecard.confidenceDistribution.high.precision).toBeGreaterThan(scorecard.confidenceDistribution.low.precision)
    expect(scorecard.recentEvaluations.length).toBeGreaterThan(0)
  })

  it('PulseEngine prioritizes portfolio-weighted holdings in attention ranking', () => {
    const now = new Date()
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

    // Two stocks with similar returns, but stock B is a core holding (₹75,000)
    const symA = 'TRACKER_STOCK'
    const symB = 'CORE_HOLDING_STOCK'

    const observationsMap = new Map<string, HistoricalObservation[]>()
    observationsMap.set(symA, [
      { symbol: symA, price: 100, volume: 1000, source: 'test', sourceTimestamp: fourHoursAgo.toISOString(), receivedTimestamp: now.toISOString() },
      { symbol: symA, price: 103, volume: 1000, source: 'test', sourceTimestamp: now.toISOString(), receivedTimestamp: now.toISOString() },
    ])
    observationsMap.set(symB, [
      { symbol: symB, price: 100, volume: 1000, source: 'test', sourceTimestamp: fourHoursAgo.toISOString(), receivedTimestamp: now.toISOString() },
      { symbol: symB, price: 103, volume: 1000, source: 'test', sourceTimestamp: now.toISOString(), receivedTimestamp: now.toISOString() },
    ])

    const contextsMap = new Map<string, SymbolExtraContext>()
    contextsMap.set(symA, { watchReason: 'JUST_WATCHING', portfolioHolding: 0 })
    contextsMap.set(symB, { watchReason: 'OWN_IT', portfolioHolding: 75000 })

    const result = PulseEngine.evaluateWatchlist(fourHoursAgo, now, observationsMap, undefined, contextsMap)
    expect(result.events.length).toBe(2)

    // Stock B should be boosted by portfolioRankBoost
    const eventB = result.events.find(e => e.symbol === symB)
    expect(eventB?.portfolioRankBoost).toBeGreaterThan(0)
  })
})
