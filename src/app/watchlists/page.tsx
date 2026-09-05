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
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col">
      <Navbar watchlists={watchlists} selectedWatchlistId={selectedWlId} onSelectWatchlist={setSelectedWlId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <List className="w-5 h-5 text-brand-400" />
              Watchlist Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Organize the securities you want Pulse to track and analyze during your absence.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-surface-900 hover:bg-surface-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            ← Open Pulse Inbox
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Watchlists List & Create */}
            <div className="space-y-6">
              {/* Watchlists Tab */}
              <div className="card-glass p-5 rounded-2xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
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
                            ? 'bg-brand-500/10 border border-brand-500/30 text-white'
                            : 'hover:bg-surface-900 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold">{w.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {w.items?.length || 0} stocks
                          </div>
                        </div>

                        {watchlists.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteWatchlist(w.id)
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Create New Watchlist */}
                <form onSubmit={handleCreateWatchlist} className="pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      placeholder="New watchlist name..."
                      className="flex-1 px-3 py-2 rounded-lg bg-surface-900 border border-slate-700 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={creating || !newWatchlistName.trim()}
                      className="p-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-surface-950 disabled:opacity-50 transition-colors"
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
                <div className="card-glass p-6 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedWatchlist.name}</h2>
                      <p className="text-xs text-slate-400">
                        {selectedWatchlist.items?.length || 0} securities monitored by Pulse
                      </p>
                    </div>

                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
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
                            className="flex items-center justify-between p-4 rounded-xl bg-surface-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-xs text-brand-400">
                                {item.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-white">{item.symbol}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  Tracked in Pulse
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveSymbol(item.symbol)}
                              disabled={isRemoving}
                              title="Remove stock from watchlist"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-sm mb-3">No securities in this watchlist yet.</p>
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-semibold"
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
