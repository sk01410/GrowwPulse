'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  X,
  Activity,
  BarChart3,
  Zap,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { BacktestService, BacktestScorecard } from '@/lib/pulse/backtest.service'

interface Props {
  isOpen: boolean
  onClose: () => void
  symbols?: string[]
  watchlistName?: string
  watchlistId?: string
  quotes?: Record<string, any>
}

export function AccuracyScorecardModal({
  isOpen,
  onClose,
  symbols,
  watchlistName,
  watchlistId,
  quotes,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [scorecard, setScorecard] = useState<BacktestScorecard>(() =>
    BacktestService.getModelScorecardForSymbols(symbols, watchlistName || 'Active Watchlist', quotes)
  )

  useEffect(() => {
    if (!isOpen) return

    if (symbols && symbols.length > 0) {
      setScorecard(BacktestService.getModelScorecardForSymbols(symbols, watchlistName || 'Active Watchlist', quotes))
      return
    }

    // Otherwise fetch dynamic watchlist backtest from API
    let isMounted = true
    setLoading(true)

    const url = watchlistId
      ? `/api/v1/pulse/backtest?watchlistId=${encodeURIComponent(watchlistId)}`
      : '/api/v1/pulse/backtest'

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.scorecard) {
          setScorecard(data.scorecard)
        }
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic backtest scorecard:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, symbols, watchlistName, watchlistId, quotes])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E8ECF2] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F8F3] border border-[#C6F0E0] text-[#00D09C] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">
                Pulse Engine Reliability & Backtest Scorecard
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5F4FD] text-[#5367F5] border border-[#B1D0FB]">
                <Zap className="w-3 h-3" /> Live Dynamic
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Empirical quantitative validation across {scorecard.samplePeriod}
            </p>
          </div>
        </div>

        {/* Watchlist Context Badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] text-xs text-[#4B5563]">
          <span className="font-semibold text-[#111827]">
            {scorecard.watchlistName || watchlistName || 'Current Watchlist'}
          </span>
          <span className="text-[#9CA3AF]">•</span>
          <span className="text-[#00D09C] font-bold">{scorecard.symbolsCount} Active Stocks Evaluated</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs text-[#6B7280]">
            <Loader2 className="w-6 h-6 animate-spin text-[#00D09C]" />
            <span>Computing live statistical backtests for your watchlist...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="bg-[#F8FAFC] border border-[#E8ECF2] p-3.5 rounded-2xl">
                <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Signal Precision
                </div>
                <div className="text-2xl font-black text-[#00D09C] mt-1">
                  {scorecard.precisionRate}%
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                  Actionable turning points
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E8ECF2] p-3.5 rounded-2xl">
                <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Noise Rejection
                </div>
                <div className="text-2xl font-black text-[#5367F5] mt-1">
                  {scorecard.noiseRejectionRate}%
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                  Quiet days muted
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E8ECF2] p-3.5 rounded-2xl">
                <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Avg Alert Lag
                </div>
                <div className="text-2xl font-black text-[#7C3AED] mt-1">
                  {scorecard.avgResponseLagMinutes}m
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                  From market move
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E8ECF2] p-3.5 rounded-2xl">
                <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  Evaluations
                </div>
                <div className="text-2xl font-black text-[#D97706] mt-1">
                  {scorecard.evaluatedAlertsCount}
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-0.5">
                  Historical flag events
                </div>
              </div>
            </div>

            {/* Confidence Stratification */}
            <div className="mb-6 p-4 rounded-2xl bg-[#FAFAFA] border border-[#E8ECF2]">
              <div className="text-xs font-bold text-[#111827] mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00D09C]" />
                Precision Stratification by Model Confidence
              </div>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#00D09C] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> High Confidence ({scorecard.confidenceDistribution.high.count} flags)
                    </span>
                    <span className="font-bold text-[#111827]">
                      {scorecard.confidenceDistribution.high.precision}% Precision
                    </span>
                  </div>
                  <div className="w-full bg-[#E8ECF2] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00D09C] h-full rounded-full transition-all duration-500"
                      style={{ width: `${scorecard.confidenceDistribution.high.precision}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#5367F5] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Limited History ({scorecard.confidenceDistribution.medium.count} flags)
                    </span>
                    <span className="font-bold text-[#111827]">
                      {scorecard.confidenceDistribution.medium.precision}% Precision
                    </span>
                  </div>
                  <div className="w-full bg-[#E8ECF2] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5367F5] h-full rounded-full transition-all duration-500"
                      style={{ width: `${scorecard.confidenceDistribution.medium.precision}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Watchlist Backtest Verifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Live Watchlist Verifications ({scorecard.recentEvaluations.length} Stocks)
                </div>
                <span className="text-[11px] text-[#9CA3AF]">
                  Anchored to your active symbols
                </span>
              </div>
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {scorecard.recentEvaluations.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8ECF2] hover:border-[#B2F0E1] transition-colors flex items-start justify-between gap-3 text-xs shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#111827] text-sm">{ev.symbol}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            ev.movementPercent >= 0
                              ? 'bg-[#E8F8F3] text-[#00D09C] border-[#B2F0E1]'
                              : 'bg-[#FDECEC] text-[#EF4444] border-[#FCA5A5]'
                          }`}
                        >
                          {ev.movementPercent >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {ev.detectedZScore}σ ({ev.movementPercent > 0 ? '+' : ''}
                          {ev.movementPercent}%)
                        </span>
                      </div>
                      <p className="text-[#4B5563] text-[11px] leading-relaxed">
                        {ev.validatedNextWindow}
                      </p>
                    </div>
                    <div className="shrink-0 font-semibold text-[10px] px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E8ECF2] text-[#374151]">
                      {ev.outcome === 'VERIFIED_ANOMALY'
                        ? '✅ Validated'
                        : ev.outcome === 'CONSOLIDATION'
                        ? '🔄 Mean Reverted'
                        : '🛡️ Noise Suppressed'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#E8ECF2] flex items-center justify-between">
          <span className="text-[11px] text-[#9CA3AF]">
            Evaluated using historical 5m snapshots and trading window boundary filters.
          </span>
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2.5 text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
