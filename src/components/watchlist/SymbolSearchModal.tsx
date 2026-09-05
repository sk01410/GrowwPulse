'use client'

import { useState, useEffect } from 'react'
import { Search, X, Plus, Loader2, Check } from 'lucide-react'

interface SymbolResult {
  symbol: string
  name: string
  exchange: string
  currency: string
}

interface SymbolSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSymbolAdded: (symbol: string) => void
  existingSymbols: string[]
}

export function SymbolSearchModal({
  isOpen,
  onClose,
  onSymbolAdded,
  existingSymbols,
}: SymbolSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SymbolResult[]>([])
  const [loading, setLoading] = useState(false)
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/v1/symbols?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.symbols) {
          setResults(data.data.symbols)
        }
      })
      .finally(() => setLoading(false))
  }, [query, isOpen])

  if (!isOpen) return null

  const handleAdd = async (symbol: string) => {
    setAddingSymbol(symbol)
    try {
      await onSymbolAdded(symbol)
    } finally {
      setAddingSymbol(null)
    }
  }

  const handleCustomAdd = () => {
    const trimmed = query.trim().toUpperCase()
    if (trimmed) {
      handleAdd(trimmed)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg card-glass rounded-2xl p-6 shadow-2xl border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Add Stock to Watchlist</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol (e.g. RELIANCE, TCS, INFY, AAPL)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-slate-500 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
              Searching market symbols...
            </div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const isAlreadyAdded = existingSymbols.includes(item.symbol.toUpperCase())
              const isAdding = addingSymbol === item.symbol

              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-900/90 border border-transparent hover:border-slate-800 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.symbol}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.exchange}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">{item.name}</div>
                  </div>

                  {isAlreadyAdded ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium px-2.5 py-1 rounded-md bg-slate-800/60">
                      <Check className="w-3.5 h-3.5 text-brand-400" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(item.symbol)}
                      disabled={isAdding}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-surface-950 font-semibold text-xs transition-colors disabled:opacity-50"
                    >
                      {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add
                    </button>
                  )}
                </div>
              )
            })
          ) : query.trim() ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <p>No exact match found in directory.</p>
              <button
                onClick={handleCustomAdd}
                className="mt-3 inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add &quot;{query.trim().toUpperCase()}&quot; as custom symbol
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs">
              Type a company name or ticker to search
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
