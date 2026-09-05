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
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
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
    if (!confirm('Are you sure you want to delete this watchlist?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/v1/watchlists/${id}`, { method: 'DELETE' })
      const remaining = watchlists.filter((w) => w.id !== id)
      setWatchlists(remaining)
      if (selectedWlId === id) {
        setSelectedWlId(remaining[0]?.id || '')
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

  const handleAddSymbol = async (symbol: string) => {
    if (!selectedWlId) return
    const res = await fetch(`/api/v1/watchlists/${selectedWlId}/symbols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    })
    if (res.ok) {
      await fetchWatchlists()
      setIsSearchOpen(false)
    }
  }

  const selectedWatchlist = watchlists.find((w) => w.id === selectedWlId) || watchlists[0]
  const existingSymbols = (selectedWatchlist?.items || []).map((i: any) => i.symbol.toUpperCase())

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937] flex flex-col font-sans">
      <Navbar watchlists={watchlists} selectedWatchlistId={selectedWlId} onSelectWatchlist={setSelectedWlId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
              <List className="w-5 h-5 text-[#00B386]" />
              Watchlist Management
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Organize the securities you want Pulse to track and analyze during your absence.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-semibold text-[#00B386] shadow-sm transition-colors"
          >
            ← Open Pulse Inbox
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-[#6B7280]">
            <Loader2 className="w-6 h-6 animate-spin text-[#00B386]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Watchlists List & Create */}
            <div className="space-y-6">
              {/* Watchlists Tab */}
              <div className="groww-card p-5 rounded-2xl">
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
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#EAF8F3] border border-[#00B386]/40 text-[#008764]'
                            : 'hover:bg-[#F8F9FA] text-[#4B5563] border border-transparent'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{w.name}</div>
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
                            title="Delete watchlist"
                            className="p-1 rounded text-[#9CA3AF] hover:text-[#EB5757] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Create New Watchlist */}
                <form onSubmit={handleCreateWatchlist} className="pt-3 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="New watchlist name..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00B386] focus:ring-1 focus:ring-[#00B386]"
                    />
                    <button
                      type="submit"
                      disabled={creating || !newWatchlistName.trim()}
                      className="p-2 rounded-xl bg-[#00B386] hover:bg-[#009E77] text-white disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Symbols inside selected watchlist */}
            <div className="md:col-span-2">
              {selectedWatchlist ? (
                <div className="groww-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F3F4F6]">
                    <div>
                      <h2 className="text-lg font-bold text-[#1F2937]">{selectedWatchlist.name}</h2>
                      <p className="text-xs text-[#6B7280]">
                        {selectedWatchlist.items?.length || 0} securities monitored by Pulse
                      </p>
                    </div>

                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Stock
                    </button>
                  </div>

                  {selectedWatchlist.items && selectedWatchlist.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedWatchlist.items.map((item: any) => {
                        const isRemoving = removingSymbol === item.symbol
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] hover:border-[#00B386]/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#EAF8F3] border border-[#00B386]/20 flex items-center justify-center font-bold text-xs text-[#008764]">
                                {item.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-[#1F2937]">{item.symbol}</div>
                                <div className="text-[11px] text-[#6B7280]">
                                  Tracked in Pulse
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveSymbol(item.symbol)}
                              disabled={isRemoving}
                              title="Remove stock from watchlist"
                              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#EB5757] hover:bg-[#FDECEC] transition-colors disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#EB5757]" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[#6B7280]">
                      <p className="text-sm mb-3">No securities in this watchlist yet.</p>
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAF8F3] hover:bg-[#D5F2E7] text-[#008764] border border-[#00B386]/30 text-xs font-semibold transition-colors"
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

      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSymbolAdded={handleAddSymbol}
        existingSymbols={existingSymbols}
      />
    </div>
  )
}

