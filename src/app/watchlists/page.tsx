'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  List,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Bell,
  BellOff,
  VolumeX,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { RightMarketPanel } from '@/components/layout/RightMarketPanel'
import { SymbolSearchModal } from '@/components/watchlist/SymbolSearchModal'

export default function WatchlistsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [watchlists, setWatchlists] = useState<any[]>([])
  const [selectedWlId, setSelectedWlId] = useState<string>('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null)
  const [mutingSymbolId, setMutingSymbolId] = useState<string | null>(null)
  const [openMuteDropdown, setOpenMuteDropdown] = useState<string | null>(null)

  const fetchWatchlists = async () => {
    try {
      const res = await fetch('/api/v1/watchlists')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (data?.data?.watchlists) {
        setWatchlists(data.data.watchlists)
        if (!selectedWlId && data.data.watchlists.length > 0) {
          setSelectedWlId(data.data.watchlists[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlists()
  }, [])

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWatchlistName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWatchlistName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewWatchlistName('')
        await fetchWatchlists()
        if (data?.data?.watchlist?.id) {
          setSelectedWlId(data.data.watchlist.id)
        }
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWatchlist = async (id: string) => {
    if (watchlists.length <= 1) return
    setDeletingId(id)
    try {
      await fetch(`/api/v1/watchlists/${id}`, { method: 'DELETE' })
      const updated = watchlists.filter((w) => w.id !== id)
      setWatchlists(updated)
      if (selectedWlId === id && updated.length > 0) {
        setSelectedWlId(updated[0].id)
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleRemoveSymbol = async (symbol: string) => {
    if (!selectedWlId) return
    setRemovingSymbol(symbol)
    try {
      await fetch(`/api/v1/watchlists/${selectedWlId}/symbols/${symbol}`, {
        method: 'DELETE',
      })
      await fetchWatchlists()
    } finally {
      setRemovingSymbol(null)
    }
  }

  const handleMuteSymbol = async (e: React.MouseEvent, symbol: string, hours?: number) => {
    e.stopPropagation()
    if (!selectedWlId) return
    setMutingSymbolId(symbol)
    setOpenMuteDropdown(null)
    try {
      await fetch(`/api/v1/watchlists/${selectedWlId}/symbols/${symbol}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationHours: hours }),
      })
      await fetchWatchlists()
    } catch (err) {
      console.error('Mute symbol error:', err)
    } finally {
      setMutingSymbolId(null)
    }
  }

  const handleUnmuteSymbol = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation()
    if (!selectedWlId) return
    setMutingSymbolId(symbol)
    try {
      await fetch(`/api/v1/watchlists/${selectedWlId}/symbols/${symbol}/unmute`, {
        method: 'POST',
      })
      await fetchWatchlists()
    } catch (err) {
      console.error('Unmute symbol error:', err)
    } finally {
      setMutingSymbolId(null)
    }
  }

  const handleAddSymbol = async (symbol: string, watchReason?: string, targetPrice?: number) => {
    if (!selectedWlId) return
    const res = await fetch(`/api/v1/watchlists/${selectedWlId}/symbols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, watchReason, targetPrice }),
    })
    if (res.ok) {
      await fetchWatchlists()
      setIsSearchOpen(false)
    }
  }

  const selectedWatchlist = watchlists.find((w) => w.id === selectedWlId) || watchlists[0]
  const existingSymbols = (selectedWatchlist?.items || []).map((i: any) => i.symbol.toUpperCase())

  return (
    <div className="min-h-screen flex flex-row bg-[#F8FAFC] text-[#111827]">
      {/* Fixed Left Sidebar (260px) */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          watchlists={watchlists}
          selectedWatchlistId={selectedWlId}
          onSelectWatchlist={setSelectedWlId}
          onAddStockClick={() => setIsSearchOpen(true)}
        />

        <div className="flex-1 flex flex-row w-full max-w-[1400px] mx-auto">
          <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 sm:py-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2 tracking-tight">
                  <List className="w-6 h-6 text-[#00D09C]" />
                  Watchlist Management
                </h1>
                <p className="text-xs text-[#6B7280] mt-1">
                  Organize the stocks and set intent tags for Pulse to monitor while you are away.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="btn-secondary self-start sm:self-center px-4 py-2 text-xs font-bold"
              >
                ← Open Market Inbox
              </Link>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center text-[#6B7280]">
                <Loader2 className="w-6 h-6 animate-spin text-[#00D09C]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Watchlists List & Create */}
                <div className="space-y-6">
                  {/* Watchlists Tab */}
                  <div className="bg-white border border-[#E8ECF2] p-5 rounded-3xl shadow-subtle">
                    <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">
                      Your Watchlists ({watchlists.length})
                    </h3>

                    <div className="space-y-1.5 mb-4">
                      {watchlists.map((w) => {
                        const isSelected = w.id === selectedWlId
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWlId(w.id)}
                            className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#EBFCF7] border border-[#B2F0E1] text-[#008764]'
                                : 'hover:bg-[#F8FAFC] text-[#4B5563] border border-transparent'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-bold">{w.name}</div>
                              <div className="text-[11px] text-[#6B7280]">
                                {w.items?.length || 0} stocks
                              </div>
                            </div>

                            {watchlists.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteWatchlist(w.id)
                                }}
                                disabled={deletingId === w.id}
                                title="Delete watchlist"
                                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-white transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Create Watchlist Form */}
                    <form onSubmit={handleCreateWatchlist} className="pt-3 border-t border-[#E8ECF2]">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="New watchlist name..."
                          value={newWatchlistName}
                          onChange={(e) => setNewWatchlistName(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] focus:outline-none focus:border-[#00D09C]"
                        />
                        <button
                          type="submit"
                          disabled={creating || !newWatchlistName.trim()}
                          className="btn-primary px-3 py-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column: Securities in Selected Watchlist */}
                <div className="md:col-span-2">
                  {selectedWatchlist ? (
                    <div className="bg-white border border-[#E8ECF2] p-6 rounded-3xl shadow-subtle">
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8ECF2]">
                        <div>
                          <h2 className="text-lg font-extrabold text-[#111827]">
                            {selectedWatchlist.name}
                          </h2>
                          <p className="text-xs text-[#6B7280]">
                            {selectedWatchlist.items?.length || 0} stocks active in this watchlist
                          </p>
                        </div>

                        <button
                          onClick={() => setIsSearchOpen(true)}
                          className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Add Stock
                        </button>
                      </div>

                      {/* Items List */}
                      {selectedWatchlist.items && selectedWatchlist.items.length > 0 ? (
                        <div className="divide-y divide-[#E8ECF2]/70">
                          {selectedWatchlist.items.map((item: any) => {
                            const isRemoving = removingSymbol === item.symbol
                            const isMuting = mutingSymbolId === item.symbol
                            const isMuteOpen = openMuteDropdown === item.symbol
                            const isMuted = item.muted_until && new Date(item.muted_until) > new Date()

                            return (
                              <div
                                key={item.id || item.symbol}
                                onClick={() => router.push(`/pulse/${encodeURIComponent(item.symbol)}`)}
                                className="py-3 flex items-center justify-between gap-3 hover:bg-[#F8FAFC] -mx-2 px-3 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-[#E8ECF2] relative"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-[#EBFCF7] border border-[#B2F0E1] text-[#00D09C] group-hover:bg-[#00D09C] group-hover:text-white transition-colors flex items-center justify-center font-bold text-xs">
                                    {item.symbol.substring(0, 2)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-bold text-[#111827] group-hover:text-[#00D09C] transition-colors">
                                        {item.symbol}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F8FAFC] text-[#6B7280] border border-[#E8ECF2]">
                                        {item.exchange || 'NSE'}
                                      </span>
                                      {item.watch_reason && item.watch_reason !== 'JUST_WATCHING' && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#4B5563] border border-[#E8ECF2]">
                                          {item.watch_reason === 'PRICE_TARGET'
                                            ? `🎯 ₹${item.target_price}`
                                            : item.watch_reason === 'OWN_IT'
                                            ? '💼 Own It'
                                            : '🛒 Buying'}
                                        </span>
                                      )}
                                      {isMuted && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center gap-1">
                                          <BellOff className="w-3 h-3 text-[#D97706]" />
                                          Muted
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                                      <span>Click to inspect pulse & charts</span>
                                      <span className="text-[#00D09C] group-hover:translate-x-0.5 transition-transform">→</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 relative">
                                  {/* Mute Dropdown Button */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenMuteDropdown(isMuteOpen ? null : item.symbol)
                                      }}
                                      disabled={isMuting}
                                      title={isMuted ? 'Muted — click to manage' : 'Mute anomaly alerts'}
                                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                        isMuted
                                          ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                                          : 'bg-white border-[#E8ECF2] text-[#6B7280] hover:text-[#5367F5] hover:bg-[#F8FAFC]'
                                      }`}
                                    >
                                      {isMuting ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#5367F5]" />
                                      ) : isMuted ? (
                                        <BellOff className="w-4 h-4" />
                                      ) : (
                                        <Bell className="w-4 h-4" />
                                      )}
                                    </button>

                                    {/* Mute Options Menu */}
                                    {isMuteOpen && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-[#E8ECF2] p-1.5 z-30 animate-in fade-in zoom-in-95 text-left"
                                      >
                                        <div className="text-[10px] font-bold text-[#9CA3AF] px-2.5 py-1 uppercase tracking-wider">
                                          Mute Alerts
                                        </div>
                                        {isMuted ? (
                                          <button
                                            onClick={(e) => handleUnmuteSymbol(e, item.symbol)}
                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#00D09C] font-semibold hover:bg-[#EBFCF7] rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Bell className="w-3.5 h-3.5" />
                                            Unmute alerts
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              onClick={(e) => handleMuteSymbol(e, item.symbol, 2)}
                                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#374151] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                                            >
                                              <VolumeX className="w-3.5 h-3.5 text-[#6B7280]" />
                                              Mute for 2 hours
                                            </button>
                                            <button
                                              onClick={(e) => handleMuteSymbol(e, item.symbol, 24)}
                                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#374151] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                                            >
                                              <VolumeX className="w-3.5 h-3.5 text-[#6B7280]" />
                                              Mute for 24 hours
                                            </button>
                                            <button
                                              onClick={(e) => handleMuteSymbol(e, item.symbol, 168)}
                                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#374151] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                                            >
                                              <VolumeX className="w-3.5 h-3.5 text-[#6B7280]" />
                                              Mute for 7 days
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveSymbol(item.symbol)
                                    }}
                                    disabled={isRemoving}
                                    title="Remove stock from watchlist"
                                    className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    {isRemoving ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-[#EF4444]" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-[#6B7280]">
                          <p className="text-sm mb-3">No securities in this watchlist yet.</p>
                          <button
                            onClick={() => setIsSearchOpen(true)}
                            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Stocks
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </main>

          <RightMarketPanel />
        </div>
      </div>

      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSymbolAdded={handleAddSymbol}
        existingSymbols={existingSymbols}
      />
    </div>
  )
}
