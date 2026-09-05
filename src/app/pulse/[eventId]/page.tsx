'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Activity,
  Check,
  Eye,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { RightMarketPanel } from '@/components/layout/RightMarketPanel'
import { AttentionBadge, ConfidenceBadge, ProvenanceDetails } from '@/components/common/TrustBadge'
import { PulseChart } from '@/components/charts/PulseChart'
import { PulseEvent } from '@/lib/pulse/engine'

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
  const router = useRouter()
  const { eventId } = params
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventData, setEventData] = useState<PulseEvent | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [markingSeen, setMarkingSeen] = useState(false)
  const [markedSeen, setMarkedSeen] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/pulse/${encodeURIComponent(eventId)}`)
      .then((res) => {
        if (res.status === 401) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.data?.event) {
          setEventData(data.data.event)
          setChartData(data.data.chartData || [])
        } else {
          setError(data?.error || 'Event not found')
        }
      })
      .catch((err) => setError(err.message || 'Failed to load event details'))
      .finally(() => setLoading(false))
  }, [eventId, router])

  const handleMarkSeen = async () => {
    if (!eventData) return
    setMarkingSeen(true)
    try {
      await fetch('/api/v1/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: eventData.symbol }),
      })
      setMarkedSeen(true)
    } catch (err) {
      console.error('Mark seen error:', err)
    } finally {
      setMarkingSeen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D09C]" />
            <div className="text-sm font-semibold">Loading stock observation...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-white p-8 rounded-2xl border border-[#E8ECF2] shadow-xs">
              <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#111827] mb-1">Event Unavailable</h3>
              <p className="text-sm text-[#6B7280] mb-6">{error || 'Could not load event data.'}</p>
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Inbox
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isPositive = eventData.return >= 0
  const chartColor = isPositive ? '#00D09C' : '#EF4444'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex font-sans antialiased">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
            {/* Navigation Breadcrumb */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Inbox
              </Link>

              <button
                onClick={handleMarkSeen}
                disabled={markingSeen || markedSeen}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  markedSeen
                    ? 'bg-[#EBFCF7] text-[#00D09C] border border-[#B2F0E1]'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#111827] border border-[#E8ECF2] shadow-xs active:scale-98'
                }`}
              >
                {markingSeen ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D09C]" />
                ) : markedSeen ? (
                  <Check className="w-3.5 h-3.5 text-[#00D09C]" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                )}
                <span>{markedSeen ? 'Marked as seen' : 'Mark as seen'}</span>
              </button>
            </div>

            {/* Hero Header: Symbol, Price, Return & Multiplier */}
            <div className="groww-card p-6 sm:p-8 rounded-2xl mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
                      {eventData.symbol}
                    </h1>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#F1F5F9] text-[#4B5563] border border-[#E8ECF2]">
                      {eventData.exchange || 'NSE'}
                    </span>
                    <AttentionBadge level={eventData.attentionLevel} />
                    <ConfidenceBadge level={eventData.confidence} />
                  </div>
                  <div className="text-xs text-[#6B7280] flex items-center gap-2">
                    <span>Evaluated interval:</span>
                    <span className="text-[#111827] font-mono font-medium">
                      {new Date(eventData.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                      {new Date(eventData.evaluationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-3xl font-extrabold text-[#111827] tabular-nums">
                    ₹{eventData.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`text-base font-bold flex items-center sm:justify-end gap-1 tabular-nums ${isPositive ? 'text-[#00D09C]' : 'text-[#EF4444]'}`}>
                    {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    <span>
                      {eventData.evaluationPrice - eventData.referencePrice >= 0 ? '+' : '-'}₹{Math.abs(eventData.evaluationPrice - eventData.referencePrice).toFixed(2)}{' '}
                      ({isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`})
                    </span>
                    <span className="text-[#6B7280] text-xs font-normal ml-1">
                      ({eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'normal'})
                    </span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-1">
                    Last checked price: ₹{eventData.referencePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* WHAT HAPPENED: Interactive Chart */}
            <div className="groww-card p-6 rounded-2xl mb-6">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00D09C]" />
                  Price Movement Curve
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Observed price action relative to your reference last-seen point (dashed line at ₹{eventData.referencePrice.toFixed(2)})
                </p>
              </div>

              <PulseChart
                data={chartData}
                referencePrice={eventData.referencePrice}
                symbol={eventData.symbol}
                color={chartColor}
              />
            </div>

            {/* WHY IT MOVED: Catalyst & Sector Intelligence Layer */}
            {(eventData.catalyst || eventData.sectorContext) && (
              <div className="groww-card p-6 rounded-2xl mb-6">
                <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00D09C]" />
                  The Story Behind The Movement
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Catalyst Card */}
                  {eventData.catalyst && (
                    <div className="p-4 rounded-xl bg-[#EBFCF7] border border-[#B2F0E1] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#B2F0E1] text-[#065F46]">
                            ⚡ {eventData.catalyst.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-[#047857] font-medium">
                            {eventData.catalyst.source}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#064E3B] mb-1.5 leading-snug">
                          {eventData.catalyst.headline}
                        </h3>
                        <p className="text-xs text-[#065F46] leading-relaxed">
                          {eventData.catalyst.summary}
                        </p>
                      </div>
                      {eventData.catalyst.url && (
                        <a
                          href={eventData.catalyst.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#00D09C] hover:underline mt-3 inline-block"
                        >
                          Read full source reporting →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Sector Divergence Card */}
                  {eventData.sectorContext && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8ECF2] text-[#374151]">
                            🌊 {eventData.sectorContext.sectorName}
                          </span>
                          <span className="text-xs font-bold text-[#111827]">
                            Sector: {eventData.sectorContext.sectorChangePercent >= 0 ? '+' : ''}{eventData.sectorContext.sectorChangePercent}%
                          </span>
                        </div>
                        <div className="my-2">
                          <div className="text-xs text-[#6B7280]">Idiosyncratic Alpha Divergence:</div>
                          <div className={`text-xl font-black ${eventData.sectorContext.idiosyncraticDivergence >= 0 ? 'text-[#00D09C]' : 'text-[#EF4444]'}`}>
                            {eventData.sectorContext.idiosyncraticDivergence >= 0 ? '+' : ''}{eventData.sectorContext.idiosyncraticDivergence}% vs Benchmark
                          </div>
                        </div>
                        <p className="text-xs text-[#4B5563] leading-relaxed">
                          {eventData.sectorContext.relativeNarrative}
                        </p>
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] mt-3">
                        Benchmark: {eventData.sectorContext.benchmarkIndex}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistical Analysis Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* WAS IT UNUSUAL? */}
              <div className="groww-card p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5367F5]" />
                  Was it unusual?
                </h3>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8ECF2]">
                    <span className="text-xs text-[#6B7280]">Price When You Left</span>
                    <span className="text-sm font-semibold text-[#111827] tabular-nums">
                      ₹{eventData.referencePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8ECF2]">
                    <span className="text-xs text-[#6B7280]">Current Price</span>
                    <span className="text-sm font-bold text-[#111827] tabular-nums">
                      ₹{eventData.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8ECF2]">
                    <span className="text-xs text-[#6B7280]">Change Since Last Check</span>
                    <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-[#00D09C]' : 'text-[#EF4444]'}`}>
                      {eventData.evaluationPrice - eventData.referencePrice >= 0 ? '+' : '-'}₹{Math.abs(eventData.evaluationPrice - eventData.referencePrice).toFixed(2)}{' '}
                      ({isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8ECF2]">
                    <span className="text-xs text-[#6B7280]">Typical Expected Range</span>
                    <span className="text-sm font-bold text-[#111827] tabular-nums">
                      ±{eventData.expectedMovementPercent}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8ECF2]">
                    <span className="text-xs text-[#6B7280]">Unusualness Multiplier</span>
                    <span className="text-sm font-extrabold text-[#D97706] tabular-nums">
                      {eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'Normal range'}
                    </span>
                  </div>

                  {eventData.volumeMultiplier && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">Trading Volume Signal</span>
                      <span className="text-sm font-bold text-[#5367F5] tabular-nums">
                        {eventData.volumeMultiplier}× average volume
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* WHY WAS THIS SURFACED? */}
              <div className="groww-card p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#00D09C]" />
                    Why was this surfaced?
                  </h3>

                  <div className="text-sm text-[#111827] leading-relaxed bg-[#F8FAFC] p-4 rounded-xl border border-[#E8ECF2] mb-3">
                    {eventData.whySurfaced}
                  </div>

                  <div className="text-xs text-[#6B7280] leading-relaxed">
                    {eventData.explanation}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E8ECF2] text-[11px] text-[#9CA3AF]">
                  * Pulse computes statistical anomaly heuristics over historical interval volatility. This is informational and not investment advice.
                </div>
              </div>
            </div>

            {/* DATA PROVENANCE DETAILS */}
            <div className="groww-card p-6 rounded-2xl">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                Data Details & Provenance
              </h3>

              <ProvenanceDetails {...eventData.provenance} />
            </div>
          </main>

          {/* 3. Right Financial Information Panel */}
          <RightMarketPanel />
        </div>
      </div>
    </div>
  )
}
