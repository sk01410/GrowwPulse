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
  onSymbolAdded: (symbol: string, watchReason?: string, targetPrice?: number) => void
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
  const [watchReason, setWatchReason] = useState<string>('JUST_WATCHING')
  const [targetPrice, setTargetPrice] = useState<string>('')

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
      const parsedPrice = targetPrice && !isNaN(Number(targetPrice)) ? Number(targetPrice) : undefined
      await onSymbolAdded(symbol, watchReason, parsedPrice)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1F2937]">Add Stock to Watchlist</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks by name or ticker (e.g. Reliance, TCS, Infy)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:bg-white focus:border-[#00B386] focus:ring-3 focus:ring-[#E8F8F3] transition-all"
            autoFocus
          />
        </div>

        {/* Intent Tagging Options */}
        <div className="mb-4 p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
              Why are you watching this?
            </label>
            <span className="text-[10px] text-[#9CA3AF]">Customizes explanation</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'JUST_WATCHING', label: '👀 Just Watching', desc: 'General observation' },
              { id: 'PRICE_TARGET', label: '🎯 Price Target', desc: 'Alert on price level' },
              { id: 'OWN_IT', label: '💼 I Own It', desc: 'Portfolio holding' },
              { id: 'CONSIDERING_BUY', label: '🛒 Considering Buy', desc: 'Evaluating entry' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWatchReason(opt.id)}
                className={`text-left p-2 rounded-lg border text-xs transition-all ${
                  watchReason === opt.id
                    ? 'border-[#00B386] bg-[#EAF8F3] text-[#00A878] font-bold shadow-xs'
                    : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#D1D5DB]'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] text-[#9CA3AF] font-normal">{opt.desc}</div>
              </button>
            ))}
          </div>

          {watchReason === 'PRICE_TARGET' && (
            <div className="pt-1">
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                Target Price (₹)
              </label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 1300.00"
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-none focus:border-[#00B386]"
              />
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-[#9CA3AF] gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#00B386]" />
              Searching stocks...
            </div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const isAlreadyAdded = existingSymbols.includes(item.symbol.toUpperCase())
              const isAdding = addingSymbol === item.symbol

              return (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F9FA] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1F2937]">{item.symbol}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                        {item.exchange}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7280] truncate max-w-xs">{item.name}</div>
                  </div>

                  {isAlreadyAdded ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#00A878] font-semibold px-2.5 py-1 rounded-lg bg-[#EAF8F3]">
                      <Check className="w-3.5 h-3.5 text-[#00A878]" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(item.symbol)}
                      disabled={isAdding}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00B386] hover:bg-[#009B75] text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
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
            <div className="py-6 text-center text-[#6B7280] text-xs">
              <p>No listed company found matching &quot;{query}&quot;.</p>
              <button
                onClick={handleCustomAdd}
                className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#E8F8F3] hover:bg-[#d6f4ea] text-[#009B75] text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add &quot;{query.trim().toUpperCase()}&quot;
              </button>
            </div>
          ) : (
            <div className="py-6 text-center text-[#9CA3AF] text-xs">
              Search by company name or ticker symbol
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
