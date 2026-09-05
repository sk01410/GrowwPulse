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
  Volume2,
  Info,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
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
      <div className="min-h-screen bg-surface-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <div className="text-sm font-medium">Reconstructing temporal movement...</div>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="card-glass p-8 rounded-2xl border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Event Unavailable</h3>
            <p className="text-sm text-slate-400 mb-6">{error || 'Could not load event data.'}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-surface-950 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPositive = eventData.return >= 0
  const chartColor = isPositive ? '#00d09c' : '#ef4444'

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Inbox
          </Link>

          <button
            onClick={handleMarkSeen}
            disabled={markingSeen || markedSeen}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              markedSeen
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface-900 hover:bg-surface-800 text-slate-200 border border-slate-700/80 active:scale-95'
            }`}
          >
            {markingSeen ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
            ) : markedSeen ? (
              <Check className="w-3.5 h-3.5 text-brand-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{markedSeen ? 'Marked as seen' : 'Mark as seen'}</span>
          </button>
        </div>

        {/* Hero Header: Symbol, Price, Return & Multiplier */}
        <div className="card-glass p-6 sm:p-8 rounded-3xl mb-8 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {eventData.symbol}
                </h1>
                <AttentionBadge level={eventData.attentionLevel} />
                <ConfidenceBadge level={eventData.confidence} />
              </div>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <span>Evaluated interval:</span>
                <span className="text-slate-300 font-mono text-xs">
                  {new Date(eventData.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                  {new Date(eventData.evaluationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                ₹{eventData.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-base font-bold flex items-center sm:justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                {isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`}
                <span className="text-slate-400 text-xs font-normal ml-1">
                  ({eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'normal'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT HAPPENED: Interactive Chart (Section 43, 145) */}
        <div className="card-glass p-6 rounded-3xl mb-8 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" />
                What Happened During Your Absence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Observed price curve relative to your reference last-seen point (dashed line)
              </p>
            </div>
          </div>

          <PulseChart
            data={chartData}
            referencePrice={eventData.referencePrice}
            symbol={eventData.symbol}
            color={chartColor}
          />
        </div>

        {/* Statistical Analysis Breakdown Grid (Section 43) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* WAS IT UNUSUAL? */}
          <div className="card-glass p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Was it unusual?
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">Actual Observed Movement</span>
                <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">Typical Expected Movement</span>
                <span className="text-sm font-bold text-slate-200">
                  ±{eventData.expectedMovementPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs text-slate-400">Unusualness Multiplier</span>
                <span className="text-sm font-extrabold text-amber-400">
                  {eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'Normal range'}
                </span>
              </div>

              {eventData.volumeMultiplier && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Trading Volume Signal</span>
                  <span className="text-sm font-bold text-blue-400">
                    {eventData.volumeMultiplier}× average volume
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WHY WAS THIS SURFACED? (Section 39, 40) */}
          <div className="card-glass p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-400" />
                Why was this surfaced?
              </h3>

              <p className="text-sm text-slate-200 leading-relaxed bg-surface-900/60 p-4 rounded-xl border border-slate-800/80 mb-4">
                {eventData.whySurfaced}
              </p>

              <div className="text-xs text-slate-400 leading-relaxed">
                {eventData.explanation}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              * Note: Pulse computes statistical anomaly heuristics over interval volatility. This is not investment advice or a price prediction.
            </div>
          </div>
        </div>

        {/* DATA PROVENANCE DETAILS (Section 43, 44, 147) */}
        <div className="card-glass p-6 rounded-2xl border border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Data Details & Provenance
          </h3>

          <ProvenanceDetails {...eventData.provenance} />
        </div>
      </main>
    </div>
  )
}
