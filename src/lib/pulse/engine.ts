import { defaultPulseConfig, PulseConfig } from './config'
import { HistoricalObservation } from '@/lib/market/types'

export type ConfidenceLevel = 'HIGH' | 'LIMITED' | 'INSUFFICIENT'
export type AttentionLevel = 'HIGH_ATTENTION' | 'IMPORTANT' | 'WATCH' | 'NORMAL'

export interface PulseEvent {
  eventId: string
  symbol: string
  referenceTime: string
  evaluationTime: string
  referencePrice: number
  evaluationPrice: number
  return: number
  returnPercent: number
  expectedMovement: number
  expectedMovementPercent: number
  unusualness: number
  confidence: ConfidenceLevel
  attentionLevel: AttentionLevel
  volumeMultiplier: number | null
  explanation: string
  whySurfaced: string
  hasMeaningfulMovement: boolean
  provenance: {
    source: string
    observedTimestamp: string
    receivedTimestamp: string
    isFresh: boolean
  }
}

export interface PulseSummary {
  awayDurationMinutes: number
  referenceTime: string
  evaluationTime: string
  totalStocks: number
  movedCount: number
  attentionCount: number
}

export interface PulseEngineResult {
  summary: PulseSummary
  events: PulseEvent[]
  rankedEvents: PulseEvent[]
  normalEvents: PulseEvent[]
}

export class PulseEngine {
  /**
   * Pure deterministic calculation for a single symbol.
   */
  static evaluateSymbol(
    symbol: string,
    referenceTime: Date,
    evaluationTime: Date,
    observations: HistoricalObservation[],
    config: PulseConfig = defaultPulseConfig
  ): PulseEvent {
    // 1. Sort observations chronologically
    const sorted = [...observations].sort(
      (a, b) => new Date(a.sourceTimestamp).getTime() - new Date(b.sourceTimestamp).getTime()
    )

    const eventId = `evt_${symbol}_${referenceTime.getTime()}_${evaluationTime.getTime()}`

    // Edge case: empty observations
    if (sorted.length === 0) {
      return {
        eventId,
        symbol,
        referenceTime: referenceTime.toISOString(),
        evaluationTime: evaluationTime.toISOString(),
        referencePrice: 0,
        evaluationPrice: 0,
        return: 0,
        returnPercent: 0,
        expectedMovement: 0,
        expectedMovementPercent: 0,
        unusualness: 0,
        confidence: 'INSUFFICIENT',
        attentionLevel: 'NORMAL',
        volumeMultiplier: null,
        explanation: 'No market observations available for this interval.',
        whySurfaced: 'No data available to evaluate movement.',
        hasMeaningfulMovement: false,
        provenance: {
          source: 'N/A',
          observedTimestamp: evaluationTime.toISOString(),
          receivedTimestamp: evaluationTime.toISOString(),
          isFresh: false,
        },
      }
    }

    // 2. Identify evaluation observation (closest on or before evaluationTime, or last available)
    let evalObs = sorted.filter(o => new Date(o.sourceTimestamp) <= evaluationTime).pop()
    if (!evalObs) evalObs = sorted[sorted.length - 1]

    // 3. Identify reference observation (closest on or before referenceTime)
    let refObs = sorted.filter(o => new Date(o.sourceTimestamp) <= referenceTime).pop()
    if (!refObs) {
      refObs = sorted[0]
    }

    // Edge case: if refObs and evalObs collapsed to the identical observation (e.g. market closed / weekend)
    // and the requested absence window has elapsed time, select the observation that reflects that absence window
    if (refObs.sourceTimestamp === evalObs.sourceTimestamp && sorted.length > 1) {
      const awayDurationMs = evaluationTime.getTime() - referenceTime.getTime()
      if (awayDurationMs > 0) {
        const evalObsTime = new Date(evalObs.sourceTimestamp).getTime()
        const targetRefTime = new Date(evalObsTime - awayDurationMs)
        const candidateRef = sorted.filter(o => new Date(o.sourceTimestamp) <= targetRefTime).pop()
        if (candidateRef && candidateRef.sourceTimestamp !== evalObs.sourceTimestamp) {
          refObs = candidateRef
        } else {
          // If candidate is before the first snapshot or identical, pick earlier snapshot
          const evalIdx = sorted.findIndex(o => o.sourceTimestamp === evalObs.sourceTimestamp)
          if (evalIdx > 0) {
            // Pick a snapshot proportional to the away duration or first in session
            const lookbackSteps = Math.min(evalIdx, Math.max(1, Math.round(awayDurationMs / (config.baseIntervalMinutes * 60 * 1000))))
            refObs = sorted[Math.max(0, evalIdx - lookbackSteps)]
          }
        }
      }
    }

    const refPrice = Number(refObs.price)
    const evalPrice = Number(evalObs.price)

    // Calculate actual observed return: (evalPrice - refPrice) / refPrice
    const rawReturn = refPrice > 0 ? (evalPrice - refPrice) / refPrice : 0
    const returnPercent = Number((rawReturn * 100).toFixed(2))
    const absReturn = Math.abs(rawReturn)
    const hasMeaningfulMovement = absReturn >= config.meaningfulMovementThreshold

    // 4. Calculate historical baseline returns and rolling volatility
    // Baseline uses historical observations up to referenceTime (or all if few)
    let baselineObs = sorted.filter(o => new Date(o.sourceTimestamp) <= referenceTime)
    if (baselineObs.length < config.minimumObservationsForBaseline) {
      baselineObs = sorted.filter(o => new Date(o.sourceTimestamp) <= evaluationTime)
    }
    const logReturns: number[] = []

    for (let i = 1; i < baselineObs.length; i++) {
      const prev = Number(baselineObs[i - 1].price)
      const curr = Number(baselineObs[i].price)
      if (prev > 0 && curr > 0) {
        logReturns.push(Math.log(curr / prev))
      }
    }

    // 5. Assess Confidence / Data Quality (Section 34, 111, 112)
    let confidence: ConfidenceLevel = 'HIGH'
    if (logReturns.length < config.insufficientDataThreshold) {
      confidence = 'INSUFFICIENT'
    } else if (logReturns.length < config.minimumObservationsForBaseline) {
      confidence = 'LIMITED'
    }

    // 6. Calculate base volatility (std deviation of base returns)
    let baseVol = 0.01 // Default fallback 1% if zero variance
    if (logReturns.length >= 2) {
      const mean = logReturns.reduce((sum, r) => sum + r, 0) / logReturns.length
      const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (logReturns.length - 1)
      baseVol = Math.sqrt(variance)
      if (baseVol === 0 || isNaN(baseVol)) baseVol = 0.005
    }

    // 7. Interval-aware scaling: sigma_expected = sigma_base * sqrt(N) (Section 32)
    const awayDurationMinutes = Math.max(1, (evaluationTime.getTime() - referenceTime.getTime()) / (1000 * 60))
    const numBaseIntervals = Math.max(1, awayDurationMinutes / config.baseIntervalMinutes)
    const expectedMovement = baseVol * Math.sqrt(numBaseIntervals)
    const expectedMovementPercent = Number((expectedMovement * 100).toFixed(2))

    // 8. Calculate Unusualness Multiplier (Section 33)
    let unusualness = 0
    if (confidence !== 'INSUFFICIENT') {
      unusualness = expectedMovement > 0 ? Number((absReturn / expectedMovement).toFixed(1)) : 1.0
    }

    // 9. Volume Anomaly (Section 35)
    let volumeMultiplier: number | null = null
    const evalVolume = evalObs.volume
    if (evalVolume !== null && evalVolume !== undefined && evalVolume > 0) {
      const validVolumes = sorted
        .map(o => o.volume)
        .filter((v): v is number => v !== null && v !== undefined && v > 0)
      if (validVolumes.length >= 3) {
        const avgVol = validVolumes.reduce((sum, v) => sum + v, 0) / validVolumes.length
        if (avgVol > 0) {
          volumeMultiplier = Number((evalVolume / avgVol).toFixed(1))
        }
      }
    }

    // 10. Attention Classification Heuristic (Section 36, 37)
    let attentionLevel: AttentionLevel = 'NORMAL'
    if (confidence !== 'INSUFFICIENT' && hasMeaningfulMovement) {
      if (unusualness >= config.attentionThresholds.high || (unusualness >= 2.0 && (volumeMultiplier || 0) >= 2.5)) {
        attentionLevel = 'HIGH_ATTENTION'
      } else if (unusualness >= config.attentionThresholds.important) {
        attentionLevel = 'IMPORTANT'
      } else if (unusualness >= config.attentionThresholds.watch) {
        attentionLevel = 'WATCH'
      }
    }

    // 11. Deterministic Dynamic Natural Language Explanation (Section 39, 163)
    const direction = rawReturn < 0 ? 'fell' : 'rose'
    const absPctStr = `${Math.abs(returnPercent)}%`
    let explanation = ''
    let whySurfaced = ''

    if (confidence === 'INSUFFICIENT') {
      explanation = `${symbol} ${direction} ${absPctStr} since you last checked. Not enough historical data to determine whether this movement was unusual.`
      whySurfaced = 'Surfaced because of observed price change; statistical baseline is limited.'
    } else {
      explanation = `${symbol} ${direction} ${absPctStr} since you last checked. That movement was approximately ${unusualness}× its typical expected movement (±${expectedMovementPercent}%) over a comparable interval.`
      if (volumeMultiplier && volumeMultiplier >= 1.5) {
        explanation += ` Trading activity was also elevated (${volumeMultiplier}× average volume).`
      }

      if (attentionLevel === 'HIGH_ATTENTION') {
        whySurfaced = `Movement was significantly larger (${unusualness}×) than its typical behavior over a comparable timeframe.`
      } else if (attentionLevel === 'IMPORTANT') {
        whySurfaced = `Notable move above historical volatility bounds for this duration.`
      } else if (attentionLevel === 'WATCH') {
        whySurfaced = `Moderate move slightly exceeding typical range.`
      } else {
        whySurfaced = `Move is within normal expected statistical bounds (±${expectedMovementPercent}%).`
      }
    }

    const obsTimeMs = new Date(evalObs.sourceTimestamp).getTime()
    const isFresh = (Date.now() - obsTimeMs) <= (config.freshnessThresholdMinutes * 60 * 1000)

    return {
      eventId,
      symbol,
      referenceTime: refObs.sourceTimestamp,
      evaluationTime: evalObs.sourceTimestamp,
      referencePrice: refPrice,
      evaluationPrice: evalPrice,
      return: rawReturn,
      returnPercent,
      expectedMovement,
      expectedMovementPercent,
      unusualness,
      confidence,
      attentionLevel,
      volumeMultiplier,
      explanation,
      whySurfaced,
      hasMeaningfulMovement,
      provenance: {
        source: evalObs.source || 'MarketDataProvider',
        observedTimestamp: evalObs.sourceTimestamp,
        receivedTimestamp: evalObs.receivedTimestamp,
        isFresh,
      },
    }
  }

  /**
   * Evaluates and ranks all watchlist symbols deterministically.
   */
  static evaluateWatchlist(
    referenceTime: Date,
    evaluationTime: Date,
    symbolObservationsMap: Map<string, HistoricalObservation[]>,
    config: PulseConfig = defaultPulseConfig
  ): PulseEngineResult {
    const events: PulseEvent[] = []

    for (const [symbol, observations] of symbolObservationsMap.entries()) {
      const event = this.evaluateSymbol(symbol, referenceTime, evaluationTime, observations, config)
      events.push(event)
    }

    // Deterministic ranking tie-breaker (Section 114):
    // 1. Attention Priority (HIGH_ATTENTION > IMPORTANT > WATCH > NORMAL)
    // 2. Unusualness multiplier DESC
    // 3. Absolute return DESC
    // 4. Symbol ASC
    const attentionRankMap: Record<AttentionLevel, number> = {
      HIGH_ATTENTION: 4,
      IMPORTANT: 3,
      WATCH: 2,
      NORMAL: 1,
    }

    const sortedEvents = [...events].sort((a, b) => {
      const rankDiff = attentionRankMap[b.attentionLevel] - attentionRankMap[a.attentionLevel]
      if (rankDiff !== 0) return rankDiff

      const unDiff = b.unusualness - a.unusualness
      if (unDiff !== 0) return unDiff

      const retDiff = Math.abs(b.return) - Math.abs(a.return)
      if (retDiff !== 0) return retDiff

      return a.symbol.localeCompare(b.symbol)
    })

    const rankedEvents = sortedEvents.filter(e => e.attentionLevel !== 'NORMAL')
    const normalEvents = sortedEvents.filter(e => e.attentionLevel === 'NORMAL')

    const movedCount = events.filter(e => e.hasMeaningfulMovement).length
    const attentionCount = rankedEvents.length
    const awayDurationMinutes = Math.max(1, Math.round((evaluationTime.getTime() - referenceTime.getTime()) / (1000 * 60)))

    const summary: PulseSummary = {
      awayDurationMinutes,
      referenceTime: referenceTime.toISOString(),
      evaluationTime: evaluationTime.toISOString(),
      totalStocks: events.length,
      movedCount,
      attentionCount,
    }

    return {
      summary,
      events: sortedEvents,
      rankedEvents,
      normalEvents,
    }
  }
}
