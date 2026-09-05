'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Inbox,
  History,
  List,
  ShieldCheck,
  Bell,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react'
import { AccuracyScorecardModal } from '@/components/pulse/AccuracyScorecardModal'
import { HeroDemoTour } from '@/components/demo/HeroDemoTour'
import { NotificationSettingsModal } from '@/components/notifications/NotificationSettingsModal'

interface Props {
  onOpenScorecard?: () => void
  onOpenDemo?: () => void
  onOpenNotifications?: () => void
}

export function Sidebar({ onOpenScorecard, onOpenDemo, onOpenNotifications }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Internal modal states to ensure tools work anywhere
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false)
  const [isScorecardOpen, setIsScorecardOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

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

  const handleDemoClick = () => {
    if (onOpenDemo) {
      onOpenDemo()
    } else {
      setIsDemoTourOpen(true)
    }
  }

  const handleScorecardClick = () => {
    if (onOpenScorecard) {
      onOpenScorecard()
    } else {
      setIsScorecardOpen(true)
    }
  }

  const handleNotifClick = () => {
    if (onOpenNotifications) {
      onOpenNotifications()
    } else {
      setIsNotifOpen(true)
    }
  }

  const navItems = [
    {
      label: 'Market Inbox',
      href: '/dashboard',
      icon: Inbox,
      active: pathname === '/dashboard',
    },
    {
      label: 'Historical Replay',
      href: '/replay',
      icon: History,
      active: pathname === '/replay',
    },
    {
      label: 'Watchlists',
      href: '/watchlists',
      icon: List,
      active: pathname === '/watchlists',
    },
  ]

  return (
    <>
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 min-h-screen bg-white border-r border-[#E8ECF2] p-5 justify-between sticky top-0 h-screen overflow-y-auto">
        <div>
          {/* Groww Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 px-2 py-1 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5367F5] via-[#00D09C] to-[#08F6B6] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xl text-[#111827] tracking-tight">Groww</span>
                <span className="font-extrabold text-xl text-[#00D09C]">Pulse</span>
              </div>
              <div className="text-[10px] font-semibold text-[#5367F5] uppercase tracking-wider">
                Market Intelligence
              </div>
            </div>
          </Link>

          {/* Primary Navigation */}
          <div className="space-y-1 mb-8">
            <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 mb-2">
              Main Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    item.active
                      ? 'bg-[#EBFCF7] text-[#00D09C] font-bold shadow-2xs'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-[#00D09C]' : 'text-[#6B7280]'}`} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Intelligence Tools Section - Always Visible on All Pages */}
          <div className="space-y-1.5 mb-6">
            <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider px-3 mb-2">
              Intelligence
            </div>

            <button
              onClick={handleDemoClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#5367F5] bg-[#E5F4FD]/60 hover:bg-[#E5F4FD] transition-all text-left cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#5367F5]" />
              <span>60s Demo Tour</span>
            </button>

            <button
              onClick={handleScorecardClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#00D09C]" />
              <span>Reliability Scorecard</span>
            </button>

            <button
              onClick={handleNotifClick}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-all text-left cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#6B7280]" />
              <span>Notification Alerts</span>
            </button>
          </div>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="pt-4 border-t border-[#E8ECF2]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#EBFCF7] text-[#00D09C] border border-[#B2F0E1] flex items-center justify-center font-bold text-xs shrink-0">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#111827] truncate">
                  {userEmail?.split('@')[0] || 'Investor'}
                </div>
                <div className="text-[10px] text-[#9CA3AF] truncate">
                  {userEmail || 'Active Session'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#EF4444] hover:bg-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Internal Modals for pages that do not manage them independently */}
      <HeroDemoTour
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
      />

      <AccuracyScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  )
}

