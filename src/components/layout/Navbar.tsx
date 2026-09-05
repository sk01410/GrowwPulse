'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  History,
  List,
  LogOut,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
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
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#E8F8F3] border border-[#C6F0E0] flex items-center justify-center text-[#00B386] transition-transform group-hover:scale-105">
              <Activity className="w-5 h-5 text-[#00B386]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-[#1F2937] tracking-tight">Groww</span>
                <span className="font-bold text-lg text-[#00B386]">Pulse</span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'text-[#00B386] bg-[#E8F8F3]'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F8F9FA]'
              }`}
            >
              Market Inbox
            </Link>
            <Link
              href="/replay"
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                pathname === '/replay'
                  ? 'text-[#00B386] bg-[#E8F8F3]'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F8F9FA]'
              }`}
            >
              <History className="w-4 h-4" />
              Replay
            </Link>
            <Link
              href="/watchlists"
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                pathname === '/watchlists'
                  ? 'text-[#00B386] bg-[#E8F8F3]'
                  : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F8F9FA]'
              }`}
            >
              <List className="w-4 h-4" />
              Watchlists
            </Link>
          </nav>
        </div>

        {/* Watchlist selector, Search, & Actions */}
        <div className="flex items-center gap-3">
          {watchlists.length > 0 && onSelectWatchlist && (
            <div className="relative hidden sm:block">
              <select
                value={selectedWatchlist?.id || ''}
                onChange={(e) => onSelectWatchlist(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] hover:border-[#D1D5DB] focus:outline-none focus:border-[#00B386] focus:ring-2 focus:ring-[#E8F8F3] cursor-pointer transition-all"
              >
                {watchlists.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {onAddStockClick && (
            <button
              onClick={onAddStockClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E8F8F3] hover:bg-[#d6f4ea] text-xs font-bold text-[#009B75] transition-colors"
            >
              <Plus className="w-4 h-4 text-[#00B386]" />
              <span className="hidden sm:inline">Add Stock</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh Pulse data"
              className="p-2 rounded-lg bg-[#F8F9FA] hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937] border border-[#E5E7EB] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00B386]' : ''}`} />
            </button>
          )}

          <div className="h-5 w-[1px] bg-[#E5E7EB] hidden sm:block" />

          {/* User profile / Logout */}
          <div className="flex items-center gap-2">
            {userEmail && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8F8F3] text-[#009B75] font-bold text-xs flex items-center justify-center border border-[#C6F0E0]">
                  {userEmail[0].toUpperCase()}
                </div>
                <span className="text-xs text-[#4B5563] font-medium hidden lg:inline-block max-w-[130px] truncate">
                  {userEmail.split('@')[0]}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-[#6B7280] hover:text-[#EB5757] hover:bg-[#FDECEC] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
