'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
} from 'lucide-react'

interface IndexQuote {
  name: string
  symbol: string
  price: number
  change: number
  changePercent: number
}

export function RightMarketPanel() {
  const [indices, setIndices] = useState<IndexQuote[]>([
    { name: 'NIFTY 50', symbol: '^NSEI', price: 24852.15, change: 142.80, changePercent: 0.58 },
    { name: 'SENSEX', symbol: '^BSESN', price: 81332.72, change: 486.20, changePercent: 0.60 },
    { name: 'BANK NIFTY', symbol: '^NSEBANK', price: 51225.40, change: -85.10, changePercent: -0.17 },
    { name: 'NIFTY IT', symbol: '^CNXIT', price: 42180.90, change: 310.50, changePercent: 0.74 },
  ])

  useEffect(() => {
    // Optionally fetch live index quotes from Yahoo Finance
    fetch('/api/v1/market/quotes?symbols=^NSEI,^BSESN,^NSEBANK,^CNXIT')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.quotes && Array.isArray(data.data.quotes)) {
          const quotes = data.data.quotes
          setIndices((prev) =>
            prev.map((idx) => {
              const matched = quotes.find((q: any) => q.symbol === idx.symbol)
              if (matched) {
                return {
                  ...idx,
                  price: matched.price || idx.price,
                  change: matched.change || idx.change,
                  changePercent: matched.changePercent || idx.changePercent,
                }
              }
              return idx
            })
          )
        }
      })
      .catch(() => null)
  }, [])

  return (
    <aside className="hidden xl:block w-[300px] shrink-0 p-5 space-y-6">
      {/* Major Market Indices */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00D09C]" />
            Major Indices
          </div>
          <span className="text-[10px] font-semibold text-[#00D09C] bg-[#EBFCF7] px-2 py-0.5 rounded-full border border-[#B2F0E1]">
            NSE / BSE
          </span>
        </div>

        <div className="space-y-3">
          {indices.map((idx) => {
            const isGain = idx.change >= 0
            return (
              <div
                key={idx.symbol}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2]/80 hover:border-[#CBD5E1] transition-all"
              >
                <div>
                  <div className="text-xs font-bold text-[#111827]">{idx.name}</div>
                  <div className="text-xs text-[#6B7280] font-mono tabular-nums">
                    ₹{idx.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold flex items-center justify-end gap-0.5 tabular-nums ${
                      isGain ? 'text-[#00D09C]' : 'text-[#EF4444]'
                    }`}
                  >
                    {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {isGain ? '+' : ''}{idx.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] tabular-nums">
                    {isGain ? '+' : ''}₹{idx.change.toFixed(1)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Market Health Status */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8ECF2] shadow-xs">
        <div className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#5367F5]" />
          Pulse Engine State
        </div>

        <div className="space-y-2.5 text-xs text-[#6B7280]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8ECF2]">
            <span>Algorithm Status</span>
            <span className="font-bold text-[#00D09C] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse" />
              Active (2.0σ)
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#E8ECF2]">
            <span>Noise Rejection Rate</span>
            <span className="font-bold text-[#111827]">92.1%</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#E8ECF2]">
            <span>Trading Calendar</span>
            <span className="font-bold text-[#111827]">09:15 – 15:30 IST</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Weekend Gap Normalizer</span>
            <span className="font-semibold text-[#5367F5]">375m Base</span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E5F4FD] to-[#EBFCF7] border border-[#B1D0FB]/60 text-xs text-[#111827]">
        <div className="font-bold text-[#5367F5] flex items-center gap-1.5 mb-1">
          <Zap className="w-3.5 h-3.5" />
          Pro Tip
        </div>
        <p className="text-[#4B5563] text-[11px] leading-relaxed">
          Tag symbols with <strong>Price Targets</strong> or <strong>Owned Holdings</strong> in Watchlists to boost their attention priority ranking.
        </p>
      </div>
    </aside>
  )
}
