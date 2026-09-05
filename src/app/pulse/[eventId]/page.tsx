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
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#00B386]" />
          <div className="text-sm font-semibold">Loading stock observation...</div>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <AlertCircle className="w-8 h-8 text-[#EB5757] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#1F2937] mb-1">Event Unavailable</h3>
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
    )
  }

  const isPositive = eventData.return >= 0
  const chartColor = isPositive ? '#00A878' : '#EB5757'

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#1F2937] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Inbox
          </Link>

          <button
            onClick={handleMarkSeen}
            disabled={markingSeen || markedSeen}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              markedSeen
                ? 'bg-[#EAF8F3] text-[#00A878] border border-[#C6F0E0]'
                : 'bg-white hover:bg-[#F8F9FA] text-[#1F2937] border border-[#E5E7EB] shadow-2xs active:scale-98'
            }`}
          >
            {markingSeen ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00B386]" />
            ) : markedSeen ? (
              <Check className="w-3.5 h-3.5 text-[#00A878]" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
            )}
            <span>{markedSeen ? 'Marked as seen' : 'Mark as seen'}</span>
          </button>
        </div>

        {/* Hero Header: Symbol, Price, Return & Multiplier */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl mb-6 border border-[#E5E7EB] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight">
                  {eventData.symbol}
                </h1>
                <AttentionBadge level={eventData.attentionLevel} />
                <ConfidenceBadge level={eventData.confidence} />
              </div>
              <div className="text-xs text-[#6B7280] flex items-center gap-2">
                <span>Evaluated interval:</span>
                <span className="text-[#1F2937] font-mono">
                  {new Date(eventData.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →{' '}
                  {new Date(eventData.evaluationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-3xl font-extrabold text-[#1F2937] tabular-nums">
                ₹{eventData.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-base font-bold flex items-center sm:justify-end gap-1 tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                {isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`}
                <span className="text-[#6B7280] text-xs font-normal ml-1">
                  ({eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'normal'})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT HAPPENED: Interactive Chart */}
        <div className="bg-white p-6 rounded-2xl mb-6 border border-[#E5E7EB] shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00B386]" />
              Price Movement Curve
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Historical observations relative to your last-seen baseline (dashed line)
            </p>
          </div>

          <PulseChart
            data={chartData}
            referencePrice={eventData.referencePrice}
            symbol={eventData.symbol}
            color={chartColor}
          />
        </div>

        {/* Statistical Analysis Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* WAS IT UNUSUAL? */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Was it unusual?
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F2]">
                <span className="text-xs text-[#6B7280]">Actual Movement</span>
                <span className={`text-sm font-bold tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                  {isPositive ? `+${eventData.returnPercent}%` : `${eventData.returnPercent}%`}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F2]">
                <span className="text-xs text-[#6B7280]">Typical Expected Range</span>
                <span className="text-sm font-bold text-[#1F2937] tabular-nums">
                  ±{eventData.expectedMovementPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#F0F1F2]">
                <span className="text-xs text-[#6B7280]">Unusualness Multiplier</span>
                <span className="text-sm font-extrabold text-[#D97706] tabular-nums">
                  {eventData.unusualness > 0 ? `${eventData.unusualness}× normal` : 'Normal range'}
                </span>
              </div>

              {eventData.volumeMultiplier && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Trading Volume Signal</span>
                  <span className="text-sm font-bold text-[#2563EB] tabular-nums">
                    {eventData.volumeMultiplier}× average volume
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WHY WAS THIS SURFACED? */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00B386]" />
                Why was this surfaced?
              </h3>

              <div className="text-sm text-[#1F2937] leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] mb-3">
                {eventData.whySurfaced}
              </div>

              <div className="text-xs text-[#6B7280] leading-relaxed">
                {eventData.explanation}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#F0F1F2] text-[11px] text-[#9CA3AF]">
              * Pulse computes statistical anomaly heuristics over historical interval volatility. This is informational and not investment advice.
            </div>
          </div>
        </div>

        {/* DATA PROVENANCE DETAILS */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B7280]" />
            Data Details & Provenance
          </h3>

          <ProvenanceDetails {...eventData.provenance} />
        </div>
      </main>
    </div>
  )
}
