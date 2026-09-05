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
  History,
  Plus,
  Loader2,
  Eye,
  Check,
  ShieldCheck,
  VolumeX,
  Coffee,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { RightMarketPanel } from '@/components/layout/RightMarketPanel'
import { AttentionBadge, ConfidenceBadge, ProvenanceDetails } from '@/components/common/TrustBadge'
import { SymbolSearchModal } from '@/components/watchlist/SymbolSearchModal'
import { AccuracyScorecardModal } from '@/components/pulse/AccuracyScorecardModal'
import { HeroDemoTour } from '@/components/demo/HeroDemoTour'
import { NotificationSettingsModal } from '@/components/notifications/NotificationSettingsModal'
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
  const [mutingSymbolId, setMutingSymbolId] = useState<string | null>(null)
  const [openMuteDropdown, setOpenMuteDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScorecardOpen, setIsScorecardOpen] = useState(false)
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

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
        body: JSON.stringify({ watchlistId: selectedWatchlistId || undefined }),
      })
      if (pulseData) {
        const demotedToNormal = pulseData.rankedEvents.map(e => ({
          ...e,
          attentionLevel: 'NORMAL' as const,
        }))
        setPulseData({
          ...pulseData,
          summary: {
            ...pulseData.summary,
            attentionCount: 0,
          },
          rankedEvents: [],
          normalEvents: [...pulseData.normalEvents, ...demotedToNormal],
        })
      }
    } catch (err) {
      console.error('Mark all seen error:', err)
    } finally {
      setMarkingAllSeen(false)
    }
  }

  const handleAddSymbol = async (symbol: string, watchReason: string = 'JUST_WATCHING', targetPrice?: number | null) => {
    if (!selectedWatchlistId) return
    const res = await fetch(`/api/v1/watchlists/${selectedWatchlistId}/symbols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        watchReason,
        targetPrice,
      }),
    })

    if (res.ok) {
      await fetchWatchlists()
      await fetchPulse()
      setIsSearchOpen(false)
    }
  }

  const handleMuteSymbol = async (e: React.MouseEvent, symbol: string, hours?: number) => {
    e.stopPropagation()
    if (!selectedWatchlistId) return
    setMutingSymbolId(symbol)
    setOpenMuteDropdown(null)
    try {
      await fetch(`/api/v1/watchlists/${selectedWatchlistId}/symbols/${symbol}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationHours: hours }),
      })
      await fetchPulse()
    } catch (err) {
      console.error('Mute symbol error:', err)
    } finally {
      setMutingSymbolId(null)
    }
  }

  const handleUnmuteSymbol = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    if (!selectedWatchlistId) return
    setMutingSymbolId(symbol)
    try {
      await fetch(`/api/v1/watchlists/${selectedWatchlistId}/symbols/${symbol}/unmute`, {
        method: 'POST',
      })
      await fetchPulse()
    } catch (err) {
      console.error('Unmute symbol error:', err)
    } finally {
      setMutingSymbolId(null)
    }
  }

  const toggleProvenance = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation()
    setExpandedProvenance(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  const activeWatchlist = watchlists.find(w => w.id === selectedWatchlistId) || watchlists[0]
  const existingSymbols = (activeWatchlist?.items || []).map((i: any) => i.symbol.toUpperCase())

  return (
    <div className="min-h-screen flex flex-row bg-[#F8FAFC] text-[#111827]">
      {/* Fixed Left Sidebar (260px) */}
      <Sidebar
        onOpenScorecard={() => setIsScorecardOpen(true)}
        onOpenDemo={() => setIsDemoTourOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Content + Top Navigation */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          watchlists={watchlists}
          selectedWatchlistId={selectedWatchlistId}
          onSelectWatchlist={handleSelectWatchlist}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onAddStockClick={() => setIsSearchOpen(true)}
          onOpenScorecard={() => setIsScorecardOpen(true)}
          onOpenDemo={() => setIsDemoTourOpen(true)}
        />

        <div className="flex-1 flex flex-row w-full max-w-[1400px] mx-auto">
          {/* Central Feed Canvas */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 sm:py-8">
            {loading ? (
              /* Clean Skeleton Loading State */
              <div className="space-y-6 py-4 animate-pulse">
                <div className="bg-white p-8 rounded-2xl border border-[#E8ECF2] space-y-3">
                  <div className="h-4 bg-[#F8FAFC] rounded-md w-48" />
                  <div className="h-8 bg-[#F8FAFC] rounded-lg w-96" />
                  <div className="h-3 bg-[#F8FAFC] rounded-md w-64" />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#E8ECF2] h-40" />
                <div className="bg-white p-6 rounded-2xl border border-[#E8ECF2] h-40" />
              </div>
            ) : error ? (
              <div className="bg-white p-8 rounded-2xl border border-[#E8ECF2] text-center my-8 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center mx-auto mb-4 border border-[#FECACA]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#111827] mb-1">Market Data Temporarily Unavailable</h3>
                <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
                  We won&apos;t fabricate or guess market values. Please verify your connection or retry shortly.
                </p>
                <button
                  onClick={handleRefresh}
                  className="btn-primary px-6 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Retry Live Pulse
                </button>
              </div>
            ) : !pulseData || pulseData.summary.totalStocks === 0 ? (
              /* Empty Watchlist State */
              <div className="bg-white p-12 rounded-3xl text-center my-8 border border-[#E8ECF2] shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#EBFCF7] text-[#00D09C] border border-[#B2F0E1] flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-[#111827] mb-2">Your watchlist is empty</h2>
                <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6">
                  Add a few stocks (NSE, BSE, or global) to start seeing what changed while you were away.
                </p>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Stocks to Watchlist
                </button>
              </div>
            ) : (
              <div>
                {/* Core Message Hero Card */}
                <section className="mb-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8ECF2] shadow-subtle">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                        <Clock className="w-3.5 h-3.5 text-[#00D09C]" />
                        You were away for {formatDuration(pulseData.summary.awayDurationMinutes)}
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-tight">
                        <span>{pulseData.summary.movedCount} stocks moved.</span>{' '}
                        {pulseData.summary.attentionCount > 0 ? (
                          <span className="text-[#D97706]">
                            {pulseData.summary.attentionCount} deserve your attention.
                          </span>
                        ) : (
                          <span className="text-[#00D09C]">
                            0 were outside normal bounds.
                          </span>
                        )}
                      </h1>

                      <p className="mt-2 text-xs text-[#9CA3AF]">
                        Evaluated since {new Date(pulseData.summary.referenceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(pulseData.summary.referenceTime).toLocaleDateString()})
                      </p>

                      {/* Differentiator Action Badges */}
                      <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                        <button
                          onClick={() => setIsDemoTourOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5F4FD] hover:bg-[#B1D0FB]/40 border border-[#B1D0FB] text-[#5367F5] text-xs font-bold transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          60s Demo Tour
                        </button>
                        <button
                          onClick={() => setIsScorecardOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F5F7FA] border border-[#E8ECF2] text-[#111827] text-xs font-semibold transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#5367F5]" />
                          Pulse Reliability (76.4% Precision)
                        </button>
                      </div>
                    </div>

                    {pulseData.summary.attentionCount > 0 ? (
                      <button
                        onClick={handleMarkAllSeen}
                        disabled={markingAllSeen}
                        className="btn-secondary self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {markingAllSeen ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" />
                        ) : (
                          <Check className="w-4 h-4 text-[#00D09C]" />
                        )}
                        Mark all as seen
                      </button>
                    ) : (
                      <div className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBFCF7] border border-[#B2F0E1] text-[#00D09C] text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-[#00D09C]" />
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
                        <Activity className="w-3.5 h-3.5 text-[#00D09C]" />
                        Attention-Worthy Movements ({pulseData.rankedEvents.length})
                      </h2>
                      <span className="text-xs text-[#9CA3AF]">
                        Ranked by statistical unusualness
                      </span>
                    </div>

                    {pulseData.rankedEvents.map((event) => {
                      const isPositive = event.return >= 0
                      const isExpanded = !!expandedProvenance[event.eventId]
                      const isMarkingThis = markingSeenId === event.symbol
                      const isMutingThis = mutingSymbolId === event.symbol
                      const isMuteMenuOpen = openMuteDropdown === event.symbol

                      return (
                        <div
                          key={event.eventId}
                          onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                          className="groww-card groww-card-interactive p-5 sm:p-6 rounded-2xl cursor-pointer relative"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3.5">
                              <div className="w-11 h-11 rounded-2xl bg-[#EBFCF7] border border-[#B2F0E1] text-[#00D09C] flex items-center justify-center font-bold text-xs shrink-0">
                                {event.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-bold text-[#111827]">
                                    {event.symbol}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#6B7280] border border-[#E8ECF2]">
                                    {event.exchange || 'NSE'}
                                  </span>
                                  <AttentionBadge level={event.attentionLevel} />
                                  <ConfidenceBadge level={event.confidence} />

                                  {/* Intent Tag Chip */}
                                  {event.watchReason && event.watchReason !== 'JUST_WATCHING' && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#4B5563] border border-[#E8ECF2]">
                                      {event.watchReason === 'PRICE_TARGET'
                                        ? `🎯 Target: ₹${event.targetPrice || '—'}`
                                        : event.watchReason === 'OWN_IT'
                                        ? '💼 Own It'
                                        : '🛒 Considering Buy'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                                  ₹{event.evaluationPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                                  <span className="text-[#9CA3AF]">(was ₹{event.referencePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                                </div>
                              </div>
                            </div>

                            {/* Movement Metric & Actions */}
                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right">
                                <div className={`text-base font-bold flex items-center justify-end gap-0.5 tabular-nums ${isPositive ? 'text-[#00D09C]' : 'text-[#EF4444]'}`}>
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

                              {/* Mute Dropdown Button */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMuteDropdown(isMuteMenuOpen ? null : event.symbol)
                                  }}
                                  title="Mute / Snooze notifications for this stock"
                                  className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E8ECF2] transition-colors"
                                >
                                  <VolumeX className="w-4 h-4" />
                                </button>

                                {isMuteMenuOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 mt-1 w-48 bg-white border border-[#E8ECF2] rounded-2xl shadow-lg p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                                  >
                                    <div className="text-[10px] font-bold text-[#9CA3AF] px-2 py-1 uppercase tracking-wider">
                                      Mute {event.symbol}
                                    </div>
                                    <button
                                      onClick={(e) => handleMuteSymbol(e, event.symbol, 24)}
                                      disabled={isMutingThis}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#4B5563] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                                    >
                                      <span>⏰ Mute for 24 Hours</span>
                                    </button>
                                    <button
                                      onClick={(e) => handleMuteSymbol(e, event.symbol)}
                                      disabled={isMutingThis}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#4B5563] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5"
                                    >
                                      <span>🔕 Mute Indefinitely</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={(e) => handleMarkSeen(e, event.symbol)}
                                disabled={isMarkingThis}
                                title="Mark as seen"
                                className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#00D09C] border border-[#E8ECF2] transition-colors cursor-pointer"
                              >
                                {isMarkingThis ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#00D09C]" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Explanation box */}
                          <div className="text-sm text-[#374151] bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E8ECF2] leading-relaxed mb-3">
                            {event.explanation}
                          </div>

                          {/* Likely Catalyst Story Banner */}
                          {event.catalyst && (
                            <div className="mb-3 p-3 rounded-xl bg-[#EBFCF7]/70 border border-[#B2F0E1] flex items-start gap-2.5">
                              <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#B2F0E1] text-[#008764] shrink-0 mt-0.5">
                                ⚡ {event.catalyst.category.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-[#065F46] leading-snug">
                                <span className="font-semibold">{event.catalyst.headline}</span>
                                <span className="text-[10px] text-[#047857] ml-2 font-normal">({event.catalyst.source})</span>
                              </div>
                            </div>
                          )}

                          {/* Sector Divergence Comparison Widget */}
                          {event.sectorContext && (
                            <div className="mb-3 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] flex items-center justify-between text-xs flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-[#4B5563]">
                                <span className="font-semibold text-[#111827]">{event.sectorContext.sectorName}</span>
                                <span className="text-[11px] text-[#6B7280]">({event.sectorContext.sectorChangePercent >= 0 ? '+' : ''}{event.sectorContext.sectorChangePercent}%)</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-medium text-xs">
                                <span className="text-[#6B7280]">Idiosyncratic Alpha:</span>
                                <span className={event.sectorContext.idiosyncraticDivergence >= 0 ? 'text-[#00D09C] font-bold' : 'text-[#EF4444] font-bold'}>
                                  {event.sectorContext.idiosyncraticDivergence >= 0 ? '+' : ''}{event.sectorContext.idiosyncraticDivergence}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Secondary Signals & Provenance Toggle */}
                          <div className="flex items-center justify-between text-xs text-[#6B7280] pt-2 border-t border-[#F0F1F2]">
                            <div className="flex items-center gap-3">
                              <span>
                                Expected Range: ±{event.expectedMovementPercent}%
                              </span>
                              {event.volumeMultiplier && event.volumeMultiplier >= 1.2 && (
                                <span className="text-[#5367F5] font-medium">
                                  Volume: {event.volumeMultiplier}×
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => toggleProvenance(e, event.eventId)}
                              className="inline-flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#111827] transition-colors"
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
                  /* "You Can Relax" Calm Reassurance State */
                  <div className="bg-white p-8 sm:p-10 rounded-3xl text-center my-6 border border-[#B2F0E1] bg-[#EBFCF7]/40 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[#EBFCF7] text-[#00D09C] flex items-center justify-center mx-auto mb-3.5 border border-[#B2F0E1]">
                      <Coffee className="w-7 h-7 text-[#00D09C]" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-[#008764] bg-[#B2F0E1]/60 px-2.5 py-1 rounded-full mb-2">
                      <Sparkles className="w-3 h-3 text-[#008764]" />
                      Zero Anomalies Detected
                    </div>
                    <h2 className="text-2xl font-black text-[#111827] mb-2">
                      You can relax. Nothing unusual happened.
                    </h2>
                    <p className="text-sm text-[#4B5563] max-w-md mx-auto leading-relaxed">
                      All {pulseData.summary.totalStocks} stocks in your watchlist traded within standard historical volatility ranges during your {formatDuration(pulseData.summary.awayDurationMinutes)} absence.
                    </p>
                  </div>
                )}

                {/* Normal Movements Collapsible Drawer */}
                {pulseData.normalEvents.length > 0 && (
                  <section className="bg-white rounded-3xl border border-[#E8ECF2] p-5 sm:p-6 mb-8 shadow-xs">
                    <button
                      onClick={() => setShowNormalMovements(!showNormalMovements)}
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                          Normal Movements ({pulseData.normalEvents.length})
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          Within expected volatility
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#00D09C]">
                        <span>{showNormalMovements ? 'Hide' : 'View'}</span>
                        {showNormalMovements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {showNormalMovements && (
                      <div className="mt-4 pt-4 border-t border-[#E8ECF2] divide-y divide-[#F0F1F2]">
                        {pulseData.normalEvents.map((event) => {
                          const isPositive = event.return >= 0
                          const isMutingThis = mutingSymbolId === event.symbol
                          return (
                            <div
                              key={event.eventId}
                              onClick={() => router.push(`/pulse/${encodeURIComponent(event.eventId)}`)}
                              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-xs text-[#111827]">
                                  {event.symbol}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F8FAFC] text-[#6B7280] border border-[#E8ECF2]">
                                  {event.exchange || 'NSE'}
                                </span>
                                {event.isMuted && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]">
                                    Muted
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold tabular-nums ${isPositive ? 'text-[#00D09C]' : 'text-[#EF4444]'}`}>
                                  {event.evaluationPrice - event.referencePrice >= 0 ? '+' : '-'}₹{Math.abs(event.evaluationPrice - event.referencePrice).toFixed(2)} ({isPositive ? `+${event.returnPercent}%` : `${event.returnPercent}%`})
                                </span>

                                {event.isMuted && (
                                  <button
                                    onClick={(e) => handleUnmuteSymbol(e, event.symbol)}
                                    disabled={isMutingThis}
                                    title="Unmute notifications for this stock"
                                    className="text-[10px] font-semibold text-[#00D09C] hover:underline px-1.5 py-0.5 bg-[#EBFCF7] rounded border border-[#00D09C]/30"
                                  >
                                    {isMutingThis ? '...' : 'Unmute'}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Historical Replay Callout */}
                <div className="p-6 rounded-3xl border border-[#E8ECF2] bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-subtle">
                  <div>
                    <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                      <History className="w-4 h-4 text-[#00D09C]" />
                      Historical Replay Mode
                    </h4>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Time-travel back to previous sessions to test what Pulse flagged during market rallies or selloffs.
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

          {/* Right Financial Information Panel */}
          <RightMarketPanel />
        </div>
      </div>

      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSymbolAdded={handleAddSymbol}
        existingSymbols={existingSymbols}
      />

      <AccuracyScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />

      <HeroDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </div>
  )
}
