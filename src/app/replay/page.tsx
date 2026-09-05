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
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
      <Navbar watchlists={watchlists} selectedWatchlistId={selectedWatchlistId} onSelectWatchlist={setSelectedWatchlistId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Replay Mode Header Banner (Section 120, 121) */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-slate-700/80 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <History className="w-3 h-3" /> Historical Replay Mode
              </div>
              <h1 className="text-2xl font-bold text-white">Time-Travel Market Pulse</h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-slate-700 text-xs font-semibold text-brand-400 transition-colors"
          >
            ← Return to Live Pulse
          </Link>
        </div>

        {/* Replay Controls & Preset Selectors (Section 47) */}
        <div className="card-glass p-6 rounded-2xl mb-8 border border-slate-800">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Select Reference Time Window:
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => handlePresetSelect('1h')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '1h'
                  ? 'bg-brand-500 text-surface-950 shadow-md shadow-brand-500/20'
                  : 'bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              1 Hour Ago
            </button>
            <button
              onClick={() => handlePresetSelect('4h')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '4h'
                  ? 'bg-brand-500 text-surface-950 shadow-md shadow-brand-500/20'
                  : 'bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              4 Hours Ago
            </button>
            <button
              onClick={() => handlePresetSelect('open')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === 'open'
                  ? 'bg-brand-500 text-surface-950 shadow-md shadow-brand-500/20'
                  : 'bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              Market Open
            </button>
            <button
              onClick={() => handlePresetSelect('1d')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === '1d'
                  ? 'bg-brand-500 text-surface-950 shadow-md shadow-brand-500/20'
                  : 'bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              24 Hours Ago
            </button>
            <button
              onClick={() => handlePresetSelect('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedPreset === 'custom'
                  ? 'bg-brand-500 text-surface-950 shadow-md shadow-brand-500/20'
                  : 'bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80'
              }`}
            >
              Custom Range
            </button>
          </div>

          {selectedPreset === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-slate-800 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Reference Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customRefTime}
                  onChange={(e) => setCustomRefTime(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Evaluation End Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={customEvalTime}
                  onChange={(e) => setCustomEvalTime(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-surface-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs"
              >
                Run Custom Replay
              </button>
            </form>
          )}

          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>
              Replay runs the identical Pulse Engine against genuine persisted historical observations without mutating your live last-seen state.
            </span>
          </div>
        </div>

        {/* Results Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <div className="text-sm font-medium">Computing historical pulse...</div>
          </div>
        ) : error ? (
          <div className="card-glass p-8 rounded-2xl border-red-500/30 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => runReplay(selectedPreset)}
              className="px-4 py-2 rounded-lg bg-brand-500 text-surface-950 font-bold text-xs"
            >
              Retry Replay
            </button>
          </div>
        ) : replayResult ? (
          <div>
            {/* Dynamic Replay Summary */}
            <div className="card-glass p-6 rounded-3xl mb-8 border border-blue-500/30 bg-blue-500/[0.02]">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Historical Interval: {new Date(replayResult.referenceTime).toLocaleString()} → {new Date(replayResult.evaluationTime).toLocaleString()}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                <span>{replayResult.summary.movedCount} stocks moved.</span>{' '}
                {replayResult.summary.attentionCount > 0 ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
                    {replayResult.summary.attentionCount} deserved attention.
                  </span>
                ) : (
                  <span className="text-brand-400">
                    0 were unusually outside normal bounds.
                  </span>
                )}
              </h2>
            </div>

            {/* Ranked Replay Cards */}
            <div className="space-y-4">
              {replayResult.rankedEvents.map((event, idx) => {
                const isPositive = event.return >= 0
                const isExpanded = !!expandedProvenance[event.eventId]

                return (
                  <div
                    key={event.eventId}
                    onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                    className="card-glass card-glass-hover p-6 rounded-2xl cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-surface-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-center font-bold">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white group-hover:text-brand-300">
                              {event.symbol}
                            </span>
                            <AttentionBadge level={event.attentionLevel} />
                            <ConfidenceBadge level={event.confidence} />
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            ₹{event.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-base font-extrabold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`}
                        </div>
                        <div className="text-xs font-semibold text-slate-300">
                          {event.unusualness > 0 ? `${event.unusualness}× normal movement` : 'Normal move'}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 bg-surface-900/60 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed mb-3">
                      {event.explanation}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                      <span>Typical expected range: ±{event.expectedMovementPercent}%</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleProvenance(event.eventId)
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" /> Provenance
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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

              {replayResult.rankedEvents.length === 0 && (
                <div className="card-glass p-8 rounded-2xl text-center text-slate-400 text-sm">
                  ✓ No securities moved unusually enough during this historical window.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
