'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  History,
  Plus,
  Loader2,
  Eye,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AttentionBadge, ConfidenceBadge, ProvenanceDetails } from '@/components/common/TrustBadge'
import { SymbolSearchModal } from '@/components/watchlist/SymbolSearchModal'
import { PulseEvent, PulseSummary } from '@/lib/pulse/engine'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchlists, setWatchlists] = useState<any[]>([])
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('')
  const [pulseData, setPulseData] = useState<{
    summary: PulseSummary
    rankedEvents: PulseEvent[]
    normalEvents: PulseEvent[]
  } | null>(null)

  const [expandedProvenance, setExpandedProvenance] = useState<Record<string, boolean>>({})
  const [showNormalMovements, setShowNormalMovements] = useState(false)
  const [markingAllSeen, setMarkingAllSeen] = useState(false)
  const [markingSeenId, setMarkingSeenId] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Format away duration nicely
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remMins = mins % 60
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`
  }

  const fetchWatchlists = async () => {
    try {
      const res = await fetch('/api/v1/watchlists')
      if (res.status === 401) {
        router.push('/login')
        return null
      }
      const data = await res.json()
      if (data?.data?.watchlists) {
        setWatchlists(data.data.watchlists)
        if (!selectedWatchlistId && data.data.watchlists.length > 0) {
          setSelectedWatchlistId(data.data.watchlists[0].id)
        }
        return data.data.watchlists
      }
    } catch {
      // ignore
    }
    return null
  }

  const fetchPulse = useCallback(async (wId?: string) => {
    setError(null)
    const targetId = wId || selectedWatchlistId
    const url = targetId ? `/api/v1/pulse?watchlistId=${targetId}` : '/api/v1/pulse'

    try {
      const res = await fetch(url)
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch pulse')
      }
      setPulseData(json.data)
    } catch (err: any) {
      setError(err.message || 'Market data temporarily unavailable')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedWatchlistId, router])

  useEffect(() => {
    fetchWatchlists().then((lists) => {
      if (lists && lists.length > 0) {
        fetchPulse(lists[0].id)
      } else {
        fetchPulse()
      }
    })
  }, [])

  const handleSelectWatchlist = (id: string) => {
    setSelectedWatchlistId(id)
    setLoading(true)
    fetchPulse(id)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchPulse()
  }

  const handleMarkSeen = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    setMarkingSeenId(symbol)
    try {
      await fetch('/api/v1/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })
      // Optimistically update UI
      if (pulseData) {
        const remainingRanked = pulseData.rankedEvents.filter(ev => ev.symbol !== symbol)
        const removedEvent = pulseData.rankedEvents.find(ev => ev.symbol === symbol)
        const updatedNormal = removedEvent
          ? [...pulseData.normalEvents, { ...removedEvent, attentionLevel: 'NORMAL' as const }]
          : pulseData.normalEvents

        setPulseData({
          ...pulseData,
          summary: {
            ...pulseData.summary,
            attentionCount: remainingRanked.length,
          },
          rankedEvents: remainingRanked,
          normalEvents: updatedNormal,
        })
      }
    } catch (err) {
      console.error('Mark seen error:', err)
    } finally {
      setMarkingSeenId(null)
    }
  }

  const handleMarkAllSeen = async () => {
    setMarkingAllSeen(true)
    try {
      await fetch('/api/v1/seen/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId: selectedWatchlistId }),
      })
      if (pulseData) {
        setPulseData({
          ...pulseData,
          summary: {
            ...pulseData.summary,
            attentionCount: 0,
          },
          rankedEvents: [],
          normalEvents: [...pulseData.rankedEvents, ...pulseData.normalEvents].map(e => ({
            ...e,
            attentionLevel: 'NORMAL' as const,
          })),
        })
      }
    } catch (err) {
      console.error('Mark all seen error:', err)
    } finally {
      setMarkingAllSeen(false)
    }
  }

  const handleAddSymbol = async (symbol: string) => {
    if (!selectedWatchlistId) return
    const res = await fetch(`/api/v1/watchlists/${selectedWatchlistId}/symbols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    })
    if (res.ok) {
      await fetchWatchlists()
      await fetchPulse()
      setIsSearchOpen(false)
    }
  }

  const toggleProvenance = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation()
    setExpandedProvenance(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  const activeWatchlist = watchlists.find(w => w.id === selectedWatchlistId) || watchlists[0]
  const existingSymbols = (activeWatchlist?.items || []).map((i: any) => i.symbol.toUpperCase())

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100">
      <Navbar
        watchlists={watchlists}
        selectedWatchlistId={selectedWatchlistId}
        onSelectWatchlist={handleSelectWatchlist}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onAddStockClick={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            <div className="text-sm font-medium">Analyzing what changed since you last looked...</div>
            <div className="text-xs text-slate-500">Checking observations against historical volatility baselines</div>
          </div>
        ) : error ? (
          <div className="card-glass p-8 rounded-2xl border-red-500/30 text-center my-8">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Market Data Temporarily Unavailable</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              We won&apos;t guess or fabricate market results. Please verify your internet connection or try again shortly.
            </p>
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-semibold text-sm transition-colors"
            >
              Retry Live Pulse
            </button>
          </div>
        ) : !pulseData || pulseData.summary.totalStocks === 0 ? (
          /* Empty Watchlist State (Section 128) */
          <div className="card-glass p-12 rounded-3xl text-center my-8 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your watchlist is empty</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Add a few stocks to start seeing what changed while you were away.
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Stocks to Watchlist
            </button>
          </div>
        ) : (
          <div>
            {/* Core Message Header (Section 3, 4, 116) */}
            <section className="mb-8 card-glass p-6 sm:p-8 rounded-3xl border border-slate-800/90 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    You were away for {formatDuration(pulseData.summary.awayDurationMinutes)}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    <span>{pulseData.summary.movedCount} stocks moved.</span>{' '}
                    {pulseData.summary.attentionCount > 0 ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
                        {pulseData.summary.attentionCount} deserve your attention.
                      </span>
                    ) : (
                      <span className="text-brand-400">
                        0 were unusually outside normal bounds.
                      </span>
                    )}
                  </h1>

                  <p className="mt-2 text-xs text-slate-400">
                    Evaluating since {new Date(pulseData.summary.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(pulseData.summary.referenceTime).toLocaleDateString()})
                  </p>
                </div>

                {pulseData.summary.attentionCount > 0 ? (
                  <button
                    onClick={handleMarkAllSeen}
                    disabled={markingAllSeen}
                    className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {markingAllSeen ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                    ) : (
                      <Check className="w-4 h-4 text-brand-400" />
                    )}
                    Mark all as seen
                  </button>
                ) : (
                  <div className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-brand-400" />
                    You&apos;re all caught up
                  </div>
                )}
              </div>
            </section>

            {/* Ranked Attention Events List (Section 42, 66) */}
            {pulseData.rankedEvents.length > 0 ? (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-brand-400" />
                    Attention-Worthy Movements (#{pulseData.rankedEvents.length})
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Ranked by statistical unusualness multiplier
                  </span>
                </div>

                {pulseData.rankedEvents.map((event, idx) => {
                  const isPositive = event.return >= 0
                  const isExpanded = !!expandedProvenance[event.eventId]
                  const isMarkingThis = markingSeenId === event.symbol

                  return (
                    <div
                      key={event.eventId}
                      onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                      className="card-glass card-glass-hover p-5 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-surface-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
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

                        {/* Movement & Multiplier Metric */}
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <div className={`text-base font-extrabold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              {isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`}
                            </div>
                            <div className="text-xs font-semibold text-slate-300">
                              {event.unusualness > 0 ? `${event.unusualness}× normal movement` : 'Normal move'}
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleMarkSeen(e, event.symbol)}
                            disabled={isMarkingThis}
                            title="Mark as seen"
                            className="p-2 rounded-lg bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-brand-400 border border-slate-800 transition-colors"
                          >
                            {isMarkingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Explanation box */}
                      <p className="text-sm text-slate-300 bg-surface-900/60 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed mb-3">
                        {event.explanation}
                      </p>

                      {/* Secondary Signals & Provenance Toggle */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500">
                            Typical: ±{event.expectedMovementPercent}%
                          </span>
                          {event.volumeMultiplier && event.volumeMultiplier >= 1.2 && (
                            <span className="text-blue-400 font-medium">
                              Volume: {event.volumeMultiplier}×
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => toggleProvenance(e, event.eventId)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Data Provenance</span>
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
              </div>
            ) : (
              /* All Caught Up State (Section 51, 129, 145) */
              <div className="card-glass p-10 rounded-3xl text-center my-8 border border-emerald-500/20 bg-emerald-500/[0.02]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">You&apos;re all caught up.</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  The market moved while you were away, but nothing in your watchlist moved unusually enough to deserve attention.
                </p>
                <div className="mt-4 text-xs text-slate-500">
                  Last checked: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Normal Movements Section (Section 115, 1350) */}
            {pulseData.normalEvents.length > 0 && (
              <section className="mt-6">
                <button
                  onClick={() => setShowNormalMovements(!showNormalMovements)}
                  className="w-full py-3 px-4 rounded-xl bg-surface-900/50 hover:bg-surface-900 border border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    {pulseData.normalEvents.length} other stocks moved within normal expected range
                  </span>
                  {showNormalMovements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showNormalMovements && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3 animate-in fade-in duration-150">
                    {pulseData.normalEvents.map((event) => {
                      const isPositive = event.return >= 0
                      return (
                        <div
                          key={event.eventId}
                          onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                          className="p-3.5 rounded-xl bg-surface-900/60 hover:bg-surface-900 border border-slate-800/60 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-200">{event.symbol}</span>
                            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>₹{event.evaluationPrice.toFixed(2)}</span>
                            <span>{event.unusualness}× normal (±{event.expectedMovementPercent}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Historical Replay Callout */}
            <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-surface-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-400" />
                  Historical Replay
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Want to explore what Pulse would have shown earlier today or on previous trading days?
                </p>
              </div>
              <Link
                href="/replay"
                className="shrink-0 px-4 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Launch Replay Mode →
              </Link>
            </div>
          </div>
        )}
      </main>

      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSymbolAdded={handleAddSymbol}
        existingSymbols={existingSymbols}
      />
    </div>
  )
}
