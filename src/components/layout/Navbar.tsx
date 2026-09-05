'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  History,
  List,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react'

interface Watchlist {
  id: string
  name: string
}

interface NavbarProps {
  watchlists?: Watchlist[]
  selectedWatchlistId?: string
  onSelectWatchlist?: (id: string) => void
  onRefresh?: () => void
  refreshing?: boolean
  onAddStockClick?: () => void
}

export function Navbar({
  watchlists = [],
  selectedWatchlistId,
  onSelectWatchlist,
  onRefresh,
  refreshing,
  onAddStockClick,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.user?.email) {
          setUserEmail(data.data.user.email)
        }
      })
      .catch(() => null)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const selectedWatchlist = watchlists.find((w) => w.id === selectedWatchlistId) || watchlists[0]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-surface-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-105 transition-transform shadow-sm">
              <Activity className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">Groww</span>
                <span className="font-bold text-base text-brand-400">Pulse</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono -mt-0.5">
                Market Inbox
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <Link
              href="/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-surface-900 text-brand-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-white hover:bg-surface-900/50'
              }`}
            >
              Inbox
            </Link>
            <Link
              href="/replay"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pathname === '/replay'
                  ? 'bg-surface-900 text-brand-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-white hover:bg-surface-900/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Replay
            </Link>
            <Link
              href="/watchlists"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                pathname === '/watchlists'
                  ? 'bg-surface-900 text-brand-400 border border-slate-700/80'
                  : 'text-slate-400 hover:text-white hover:bg-surface-900/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Watchlists
            </Link>
          </nav>
        </div>

        {/* Watchlist selector & Actions */}
        <div className="flex items-center gap-3">
          {watchlists.length > 0 && onSelectWatchlist && (
            <div className="relative hidden sm:block">
              <select
                value={selectedWatchlist?.id || ''}
                onChange={(e) => onSelectWatchlist(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-surface-900 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {watchlists.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {onAddStockClick && (
            <button
              onClick={onAddStockClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-xs font-medium text-slate-300 border border-slate-700/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">Add Stock</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh Pulse data"
              className="p-1.5 rounded-lg bg-surface-900 hover:bg-surface-800 text-slate-300 border border-slate-700/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* User profile / Logout */}
          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="text-xs text-slate-400 hidden lg:inline-block max-w-[140px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
