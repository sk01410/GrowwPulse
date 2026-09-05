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
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F2937]">
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
          /* Clean Skeleton Loading State */
          <div className="space-y-6 py-6 animate-pulse">
            <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] space-y-3">
              <div className="h-4 bg-[#F3F4F6] rounded-md w-48" />
              <div className="h-8 bg-[#F3F4F6] rounded-lg w-96" />
              <div className="h-3 bg-[#F3F4F6] rounded-md w-64" />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] h-40" />
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] h-40" />
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] text-center my-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#FDECEC] text-[#EB5757] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1F2937] mb-1">Market Data Temporarily Unavailable</h3>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
              We won&apos;t guess or fabricate market results. Please verify your connection or try again shortly.
            </p>
            <button
              onClick={handleRefresh}
              className="btn-primary px-6 py-2.5 text-sm font-semibold"
            >
              Retry Live Pulse
            </button>
          </div>
        ) : !pulseData || pulseData.summary.totalStocks === 0 ? (
          /* Empty Watchlist State */
          <div className="bg-white p-12 rounded-2xl text-center my-8 border border-[#E5E7EB] shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F8F3] text-[#00B386] flex items-center justify-center mx-auto mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Your watchlist is empty</h2>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
              Add a few stocks to start seeing what changed while you were away.
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Stocks to Watchlist
            </button>
          </div>
        ) : (
          <div>
            {/* Core Message Hero Card */}
            <section className="mb-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#E5E7EB] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#00B386]" />
                    You were away for {formatDuration(pulseData.summary.awayDurationMinutes)}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight leading-tight">
                    <span>{pulseData.summary.movedCount} stocks moved.</span>{' '}
                    {pulseData.summary.attentionCount > 0 ? (
                      <span className="text-[#D97706]">
                        {pulseData.summary.attentionCount} deserve your attention.
                      </span>
                    ) : (
                      <span className="text-[#00A878]">
                        0 were outside normal bounds.
                      </span>
                    )}
                  </h1>

                  <p className="mt-2 text-xs text-[#9CA3AF]">
                    Evaluated since {new Date(pulseData.summary.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(pulseData.summary.referenceTime).toLocaleDateString()})
                  </p>
                </div>

                {pulseData.summary.attentionCount > 0 ? (
                  <button
                    onClick={handleMarkAllSeen}
                    disabled={markingAllSeen}
                    className="btn-secondary self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {markingAllSeen ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#00B386]" />
                    ) : (
                      <Check className="w-4 h-4 text-[#00B386]" />
                    )}
                    Mark all as seen
                  </button>
                ) : (
                  <div className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F3] border border-[#C6F0E0] text-[#00A878] text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#00A878]" />
                    You&apos;re all caught up
                  </div>
                )}
              </div>
            </section>

            {/* Ranked Attention Events List */}
            {pulseData.rankedEvents.length > 0 ? (
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#00B386]" />
                    Attention-Worthy Movements ({pulseData.rankedEvents.length})
                  </h2>
                  <span className="text-xs text-[#9CA3AF]">
                    Ranked by statistical unusualness
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
                      className="groww-card groww-card-interactive p-5 sm:p-6 rounded-2xl cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-[#E8F8F3] border border-[#C6F0E0] text-[#009B75] flex items-center justify-center font-bold text-xs shrink-0">
                            {event.symbol.substring(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-[#1F2937]">
                                {event.symbol}
                              </span>
                              <AttentionBadge level={event.attentionLevel} />
                              <ConfidenceBadge level={event.confidence} />
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                              ₹{event.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                              <span className="text-[#9CA3AF]">(was ₹{event.referencePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                            </div>
                          </div>
                        </div>

                        {/* Movement & Multiplier Metric */}
                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <div className="text-right">
                            <div className={`text-base font-bold flex items-center justify-end gap-0.5 tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                              {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              <span>
                                {event.evaluationPrice - event.referencePrice >= 0 ? '+' : '-'}₹{Math.abs(event.evaluationPrice - event.referencePrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                ({isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`})
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#4B5563]">
                              {event.unusualness > 0 ? `${event.unusualness}× normal` : 'Normal move'}
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleMarkSeen(e, event.symbol)}
                            disabled={isMarkingThis}
                            title="Mark as seen"
                            className="p-2 rounded-lg bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#00B386] border border-[#E5E7EB] transition-colors"
                          >
                            {isMarkingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#00B386]" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Explanation box */}
                      <div className="text-sm text-[#374151] bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E5E7EB] leading-relaxed mb-3">
                        {event.explanation}
                      </div>

                      {/* Secondary Signals & Provenance Toggle */}
                      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#F0F1F2]">
                        <div className="flex items-center gap-3">
                          <span>
                            Expected Range: ±{event.expectedMovementPercent}%
                          </span>
                          {event.volumeMultiplier && event.volumeMultiplier >= 1.2 && (
                            <span className="text-[#2563EB] font-medium">
                              Volume: {event.volumeMultiplier}×
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => toggleProvenance(e, event.eventId)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#1F2937] transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Provenance</span>
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
              /* All Caught Up State */
              <div className="bg-white p-10 rounded-2xl text-center my-6 border border-[#C6F0E0] bg-[#EAF8F3]/30">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8F3] text-[#00A878] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1F2937] mb-1">You&apos;re all caught up.</h3>
                <p className="text-sm text-[#6B7280] max-w-md mx-auto">
                  The market moved while you were away, but nothing in your watchlist moved unusually enough to deserve attention.
                </p>
                <div className="mt-3 text-xs text-[#9CA3AF]">
                  Last checked: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}

            {/* Normal Movements Section */}
            {pulseData.normalEvents.length > 0 && (
              <section className="mt-6">
                <button
                  onClick={() => setShowNormalMovements(!showNormalMovements)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-all"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    {pulseData.normalEvents.length} other stocks moved within normal expected bounds
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
                          className="p-4 rounded-xl bg-white hover:border-[#D1D5DB] border border-[#E5E7EB] cursor-pointer transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-sm text-[#1F2937]">{event.symbol}</span>
                            <span className={`text-xs font-bold tabular-nums ${isPositive ? 'text-[#00A878]' : 'text-[#EB5757]'}`}>
                              {event.evaluationPrice - event.referencePrice >= 0 ? '+' : '-'}₹{Math.abs(event.evaluationPrice - event.referencePrice).toFixed(2)} ({isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`})
                            </span>
                          </div>
                          <div className="text-xs text-[#6B7280] flex items-center justify-between tabular-nums">
                            <span>₹{event.evaluationPrice.toFixed(2)} <span className="text-[11px] text-[#9CA3AF]">(was ₹{event.referencePrice.toFixed(2)})</span></span>
                            <span className="text-[11px] text-[#9CA3AF]">±{event.expectedMovementPercent}% expected</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Historical Replay Callout */}
            <div className="mt-10 p-6 rounded-2xl border border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00B386]" />
                  Historical Replay Mode
                </h4>
                <p className="text-xs text-[#6B7280] mt-1">
                  Want to explore what Pulse would have shown on previous trading sessions?
                </p>
              </div>
              <Link
                href="/replay"
                className="btn-secondary shrink-0 px-4 py-2 text-xs font-bold"
              >
                Launch Replay →
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
