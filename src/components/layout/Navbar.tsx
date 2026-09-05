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
  Bell,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { NotificationSettingsModal } from '@/components/notifications/NotificationSettingsModal'
import { AccuracyScorecardModal } from '@/components/pulse/AccuracyScorecardModal'
import { HeroDemoTour } from '@/components/demo/HeroDemoTour'

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
  onOpenScorecard?: () => void
  onOpenDemo?: () => void
}

export function Navbar({
  watchlists = [],
  selectedWatchlistId,
  onSelectWatchlist,
  onRefresh,
  refreshing,
  onAddStockClick,
  onOpenScorecard,
  onOpenDemo,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isScorecardOpen, setIsScorecardOpen] = useState(false)
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


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
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E8ECF2] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile Logo / Brand Header */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#6B7280] hover:bg-[#F8FAFC] border border-[#E8ECF2]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5367F5] to-[#00D09C] flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <span className="font-extrabold text-base text-[#111827]">Groww<span className="text-[#00D09C]">Pulse</span></span>
            </Link>
          </div>

          {/* Desktop Search / Quick Action Input */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
            {onAddStockClick && (
              <button
                onClick={onAddStockClick}
                className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F5F7FA] border border-[#E8ECF2] text-xs text-[#6B7280] transition-all cursor-pointer text-left"
              >
                <Search className="w-4 h-4 text-[#9CA3AF]" />
                <span>Search Indian stocks (NSE/BSE), US tech, or catalysts...</span>
                <kbd className="ml-auto font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E8ECF2] text-[#9CA3AF]">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          {/* Right Action Tools: Watchlist Switcher, Notifications, Refresh, Add */}
          <div className="flex items-center gap-2.5">
            {watchlists.length > 0 && onSelectWatchlist && (
              <div className="relative">
                <select
                  value={selectedWatchlist?.id || ''}
                  onChange={(e) => onSelectWatchlist(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2] text-xs font-bold text-[#111827] hover:border-[#CBD5E1] focus:outline-none focus:border-[#00D09C] focus:ring-2 focus:ring-[#EBFCF7] cursor-pointer transition-all"
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
                className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Stock</span>
              </button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                title="Refresh market data"
                className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E8ECF2] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00D09C]' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setIsNotifOpen(true)}
              title="Alert Notifications Settings (Brevo & Web Push)"
              className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F5F7FA] text-[#6B7280] hover:text-[#111827] border border-[#E8ECF2] transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00D09C] ring-2 ring-white" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8ECF2] bg-white p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  pathname === '/dashboard' ? 'bg-[#EBFCF7] text-[#00D09C]' : 'text-[#6B7280]'
                }`}
              >
                <Activity className="w-4 h-4" />
                Market Inbox
              </Link>
              <Link
                href="/replay"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  pathname === '/replay' ? 'bg-[#EBFCF7] text-[#00D09C]' : 'text-[#6B7280]'
                }`}
              >
                <History className="w-4 h-4" />
                Historical Replay
              </Link>
              <Link
                href="/watchlists"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold ${
                  pathname === '/watchlists' ? 'bg-[#EBFCF7] text-[#00D09C]' : 'text-[#6B7280]'
                }`}
              >
                <List className="w-4 h-4" />
                Watchlists
              </Link>
            </div>

            <div className="pt-2 border-t border-[#E8ECF2] space-y-1">
              <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 mb-1">
                Intelligence Tools
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (onOpenDemo) {
                    onOpenDemo()
                  } else {
                    setIsDemoTourOpen(true)
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#5367F5] bg-[#E5F4FD]/60 hover:bg-[#E5F4FD] transition-all text-left cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#5367F5]" />
                60s Demo Tour
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  if (onOpenScorecard) {
                    onOpenScorecard()
                  } else {
                    setIsScorecardOpen(true)
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#00D09C]" />
                Reliability Scorecard
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsNotifOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#6B7280]" />
                Notification Alerts
              </button>
            </div>

            <div className="pt-3 border-t border-[#E8ECF2] flex items-center justify-between">
              <div className="text-xs font-semibold text-[#6B7280]">
                {userEmail || 'Active Session'}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-[#EF4444] hover:underline"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modals for Navbar triggers */}
      <NotificationSettingsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      <AccuracyScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        watchlistId={selectedWatchlistId}
        watchlistName={watchlists.find(w => w.id === selectedWatchlistId)?.name}
      />

      <HeroDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
      />
    </>
  )
}

