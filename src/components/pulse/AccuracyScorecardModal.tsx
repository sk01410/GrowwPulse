'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  X,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Zap,
} from 'lucide-react'
import { BacktestService, BacktestScorecard } from '@/lib/pulse/backtest.service'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AccuracyScorecardModal({ isOpen, onClose }: Props) {
  const [scorecard] = useState<BacktestScorecard>(() => BacktestService.getModelScorecard())

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E7EB] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F8F3] border border-[#C6F0E0] text-[#009B75] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#1F2937] tracking-tight">
              Pulse Engine Reliability & Backtest Scorecard
            </h2>
            <p className="text-xs text-[#6B7280]">
              Empirical quantitative validation across {scorecard.samplePeriod}
            </p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Signal Precision
            </div>
            <div className="text-2xl font-black text-[#009B75] mt-1">
              {scorecard.precisionRate}%
            </div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5">
              Actionable turning points
            </div>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Noise Rejection
            </div>
            <div className="text-2xl font-black text-[#2563EB] mt-1">
              {scorecard.noiseRejectionRate}%
            </div>
            <div className="text-[10px] text-[#9CA3AF] mt-0.5">
              Quiet days muted
            </div>
          </div>

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-3.5 rounded-2xl">
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

          <div className="bg-[#F8F9FA] border border-[#E5E7EB] p-3.5 rounded-2xl">
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
        <div className="mb-6 p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB]">
          <div className="text-xs font-bold text-[#1F2937] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#009B75]" />
            Precision Stratification by Model Confidence
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#009B75] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> High Confidence ({scorecard.confidenceDistribution.high.count} flags)
                </span>
                <span className="font-bold text-[#1F2937]">{scorecard.confidenceDistribution.high.precision}% Precision</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#009B75] h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorecard.confidenceDistribution.high.precision}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-[#2563EB] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Limited History ({scorecard.confidenceDistribution.medium.count} flags)
                </span>
                <span className="font-bold text-[#1F2937]">{scorecard.confidenceDistribution.medium.precision}% Precision</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorecard.confidenceDistribution.medium.precision}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Backtested Flags */}
        <div>
          <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            Sample Backtest Verifications
          </div>
          <div className="space-y-2.5">
            {scorecard.recentEvaluations.map((ev, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-[#E5E7EB] flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[#1F2937]">{ev.symbol}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EAF8F3] text-[#009B75] border border-[#C6F0E0]">
                      {ev.detectedZScore}σ Move ({ev.movementPercent > 0 ? '+' : ''}{ev.movementPercent}%)
                    </span>
                  </div>
                  <p className="text-[#4B5563] text-[11px] leading-relaxed">
                    {ev.validatedNextWindow}
                  </p>
                </div>
                <div className="shrink-0 font-semibold text-[10px] px-2 py-1 rounded-md bg-[#F3F4F6] text-[#374151]">
                  {ev.outcome === 'VERIFIED_ANOMALY' ? '✅ Validated' : ev.outcome === 'CONSOLIDATION' ? '🔄 Mean Reverted' : '🛡️ Noise Suppressed'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[11px] text-[#9CA3AF]">
            Evaluated using historical 5m snapshots and trading window boundary filters.
          </span>
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2 text-xs font-bold cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
