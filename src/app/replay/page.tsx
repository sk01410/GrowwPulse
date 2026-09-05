'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  History,
  ArrowLeft,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AttentionBadge, ConfidenceBadge, ProvenanceDetails } from '@/components/common/TrustBadge'
import { PulseEvent, PulseSummary } from '@/lib/pulse/engine'

export default function ReplayPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchlists, setWatchlists] = useState<any[]>([])
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('')

  // Replay parameters
  const [selectedPreset, setSelectedPreset] = useState<'1h' | '4h' | 'open' | '1d' | 'custom'>('4h')
  const [customRefTime, setCustomRefTime] = useState<string>('')
  const [customEvalTime, setCustomEvalTime] = useState<string>('')

  const [replayResult, setReplayResult] = useState<{
    summary: PulseSummary
    rankedEvents: PulseEvent[]
    normalEvents: PulseEvent[]
    referenceTime: string
    evaluationTime: string
  } | null>(null)

  const [expandedProvenance, setExpandedProvenance] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/v1/watchlists')
      .then((res) => {
        if (res.status === 401) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.data?.watchlists) {
          setWatchlists(data.data.watchlists)
          if (data.data.watchlists.length > 0) {
            setSelectedWatchlistId(data.data.watchlists[0].id)
          }
        }
      })
  }, [router])

  // Run replay computation
  const runReplay = async (preset: '1h' | '4h' | 'open' | '1d' | 'custom', customRef?: string, customEval?: string) => {
    setLoading(true)
    setError(null)

    const now = new Date()
    let refDate: Date
    let evalDate: Date = customEval ? new Date(customEval) : now

    if (preset === '1h') {
      refDate = new Date(evalDate.getTime() - 60 * 60 * 1000)
    } else if (preset === '4h') {
      refDate = new Date(evalDate.getTime() - 4 * 60 * 60 * 1000)
    } else if (preset === '1d') {
      refDate = new Date(evalDate.getTime() - 24 * 60 * 60 * 1000)
    } else if (preset === 'open') {
      // Market open (09:15 IST / 03:45 UTC today)
      const openTime = new Date()
      openTime.setUTCHours(3, 45, 0, 0)
      if (openTime.getTime() >= now.getTime()) {
        openTime.setUTCDate(openTime.getUTCDate() - 1)
      }
      refDate = openTime
    } else {
      refDate = customRef ? new Date(customRef) : new Date(now.getTime() - 4 * 60 * 60 * 1000)
    }

    try {
      const res = await fetch('/api/v1/pulse/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchlistId: selectedWatchlistId || undefined,
          referenceTime: refDate.toISOString(),
          evaluationTime: evalDate.toISOString(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compute historical replay')
      }

      setReplayResult(data.data)
    } catch (err: any) {
      setError(err.message || 'Historical replay failed')
    } finally {
      setLoading(false)
    }
  }

  // Run default replay on mount when watchlists loaded
  useEffect(() => {
    if (watchlists.length > 0) {
      runReplay('4h')
    }
  }, [watchlists, selectedWatchlistId])

  const handlePresetSelect = (preset: '1h' | '4h' | 'open' | '1d' | 'custom') => {
    setSelectedPreset(preset)
    if (preset !== 'custom') {
      runReplay(preset)
    }
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRefTime && customEvalTime) {
      runReplay('custom', customRefTime, customEvalTime)
    }
  }

  const toggleProvenance = (eventId: string) => {
    setExpandedProvenance(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937] flex flex-col font-sans">
      <Navbar watchlists={watchlists} selectedWatchlistId={selectedWatchlistId} onSelectWatchlist={setSelectedWatchlistId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Replay Mode Header Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF5FF] border border-[#BFDBFE] text-[#1D4ED8] text-[11px] font-bold uppercase tracking-wider mb-1">
                <History className="w-3 h-3" /> Historical Replay Mode
              </div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Time-Travel Market Pulse</h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#00B386] shadow-sm transition-colors"
          >
            ← Return to Live Pulse
          </Link>
        </div>

        {/* Replay Controls & Preset Selectors */}
        <div className="groww-card p-6 rounded-2xl mb-8">
          <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">
            Select Reference Time Window:
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => handlePresetSelect('1h')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '1h'
                  ? 'bg-[#00B386] text-white shadow-sm'
                  : 'bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
              }`}
            >
              1 Hour Ago
            </button>
            <button
              onClick={() => handlePresetSelect('4h')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '4h'
                  ? 'bg-[#00B386] text-white shadow-sm'
                  : 'bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
              }`}
            >
              4 Hours Ago
            </button>
            <button
              onClick={() => handlePresetSelect('open')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === 'open'
                  ? 'bg-[#00B386] text-white shadow-sm'
                  : 'bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
              }`}
            >
              Market Open
            </button>
            <button
              onClick={() => handlePresetSelect('1d')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '1d'
                  ? 'bg-[#00B386] text-white shadow-sm'
                  : 'bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
              }`}
            >
              24 Hours Ago
            </button>
            <button
              onClick={() => handlePresetSelect('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === 'custom'
                  ? 'bg-[#00B386] text-white shadow-sm'
                  : 'bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
              }`}
            >
              Custom Range
            </button>
          </div>

          {selectedPreset === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-[#F3F4F6] flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1">
                  Reference Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customRefTime}
                  onChange={(e) => setCustomRefTime(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-[#00B386]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider mb-1">
                  Evaluation End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customEvalTime}
                  onChange={(e) => setCustomEvalTime(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-[#00B386]"
                />
              </div>

              <button
                type="submit"
                className="btn-primary text-xs py-2 px-5"
              >
                Run Custom Replay
              </button>
            </form>
          )}

          <div className="mt-3 text-[12px] text-[#6B7280] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#00B386]" />
            <span>
              Replay runs the identical Pulse Engine against genuine persisted historical observations without mutating your live last-seen state.
            </span>
          </div>
        </div>

        {/* Results Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#6B7280] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#00B386]" />
            <div className="text-sm font-medium">Computing historical pulse...</div>
          </div>
        ) : error ? (
          <div className="groww-card p-8 rounded-2xl border-[#FDECEC] bg-[#FFF5F5] text-center">
            <p className="text-[#EB5757] text-sm mb-4 font-medium">{error}</p>
            <button
              onClick={() => runReplay(selectedPreset)}
              className="btn-primary text-xs py-2 px-4"
            >
              Retry Replay
            </button>
          </div>
        ) : replayResult ? (
          <div>
            {/* Dynamic Replay Summary */}
            <div className="groww-card p-6 rounded-2xl mb-8 bg-[#F0FDF4] border-[#DCFCE7]">
              <div className="text-xs font-semibold text-[#008764] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Historical Interval: {new Date(replayResult.referenceTime).toLocaleString()} → {new Date(replayResult.evaluationTime).toLocaleString()}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937]">
                <span>{replayResult.summary.movedCount} stocks moved.</span>{' '}
                {replayResult.summary.attentionCount > 0 ? (
                  <span className="text-[#EB5757]">
                    {replayResult.summary.attentionCount} deserved attention.
                  </span>
                ) : (
                  <span className="text-[#008764]">
                    0 were unusually outside normal bounds.
                  </span>
                )}
              </h2>
            </div>

            {/* Ranked Replay Cards */}
            {replayResult.rankedEvents.length > 0 && (
              <div className="space-y-4 mb-8">
                <div className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#00B386]" />
                  Attention-Worthy Movements ({replayResult.rankedEvents.length})
                </div>

                {replayResult.rankedEvents.map((event, idx) => {
                  const isPositive = event.return >= 0
                  const isExpanded = !!expandedProvenance[event.eventId]

                  return (
                    <div
                      key={event.eventId}
                      onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                      className="groww-card p-6 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:border-[#00B386]/30 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-bold text-[#4B5563] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-[#1F2937] group-hover:text-[#00B386] transition-colors">
                                {event.symbol}
                              </span>
                              <AttentionBadge level={event.attentionLevel} />
                              <ConfidenceBadge level={event.confidence} />
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                              ₹{event.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-base font-extrabold flex items-center justify-end gap-1 tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`}
                          </div>
                          <div className="text-xs font-semibold text-[#4B5563]">
                            {event.unusualness > 0 ? `${event.unusualness}× normal movement` : 'Normal move'}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-[#4B5563] bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E5E7EB] leading-relaxed mb-3">
                        {event.explanation}
                      </p>

                      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#F3F4F6]">
                        <span>Typical expected range: ±{event.expectedMovementPercent}%</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleProvenance(event.eventId)
                          }}
                          className="text-[12px] text-[#6B7280] hover:text-[#1F2937] flex items-center gap-1 font-medium"
                        >
                          <Info className="w-3.5 h-3.5 text-[#00B386]" /> Provenance
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3">
                          <ProvenanceDetails {...event.provenance} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Evaluated Movements / Normal Movements in Replay */}
            {replayResult.normalEvents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#6B7280] uppercase tracking-wider px-1">
                  <span>
                    {replayResult.rankedEvents.length === 0
                      ? `Evaluated Stocks (${replayResult.normalEvents.length})`
                      : `Other Stocks Moving Within Expected Range (${replayResult.normalEvents.length})`}
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] font-normal">
                    Click any stock to inspect full chart
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {replayResult.normalEvents.map((event) => {
                    const isPositive = event.return >= 0
                    return (
                      <div
                        key={event.eventId}
                        onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                        className="groww-card p-4 rounded-xl cursor-pointer hover:shadow-sm hover:border-[#00B386]/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#1F2937]">{event.symbol}</span>
                            <ConfidenceBadge level={event.confidence} />
                          </div>
                          <div className={`text-sm font-bold flex items-center gap-0.5 tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`}
                          </div>
                        </div>

                        <div className="text-xs text-[#6B7280] mb-2 tabular-nums">
                          Price: ₹{event.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (from ₹{event.referencePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                        </div>

                        <div className="text-[11px] text-[#6B7280] flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                          <span>Typical: ±{event.expectedMovementPercent}%</span>
                          <span className="font-medium text-[#4B5563]">{event.unusualness > 0 ? `${event.unusualness}× normal` : 'Within normal bounds'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {replayResult.rankedEvents.length === 0 && replayResult.normalEvents.length === 0 && (
              <div className="groww-card p-8 rounded-2xl text-center text-[#6B7280] text-sm">
                No observations available for this historical interval.
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

