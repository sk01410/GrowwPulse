import Link from 'next/link'
import { Activity, ArrowRight, ShieldCheck, Clock, SlidersHorizontal, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      {/* Top Simple Brand Header */}
      <header className="w-full border-b border-[#E5E7EB] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F8F3] border border-[#C6F0E0] flex items-center justify-center text-[#00B386]">
              <Activity className="w-5 h-5 text-[#00B386]" />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-[#1F2937]">Groww</span>
              <span className="font-bold text-lg text-[#00B386]">Pulse</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary px-5 py-2 text-sm font-semibold inline-flex items-center gap-1.5"
            >
              Open Inbox <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F8F3] border border-[#C6F0E0] text-[#009B75] text-xs font-semibold uppercase tracking-wider mb-6">
          <Activity className="w-3.5 h-3.5 text-[#00B386]" />
          Personalized Temporal Market Inbox
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1F2937] leading-[1.15] max-w-3xl">
          You were away. <br />
          <span className="text-[#00B386]">
            Here&apos;s what matters.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#6B7280] max-w-2xl leading-relaxed">
          A regular watchlist tells you what is happening right now. Pulse tells you what changed in your stocks since you last looked, filtering normal market noise to highlight what truly deserves your attention.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="btn-primary px-7 py-3.5 text-base font-semibold inline-flex items-center gap-2 shadow-sm"
          >
            Check Market Pulse
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="btn-secondary px-7 py-3.5 text-base font-semibold"
          >
            Sign In with Email
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="groww-card p-6 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-[#E8F8F3] text-[#009B75] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Temporal Tracking</h3>
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
              Never guess what occurred while offline. Pulse remembers your personal last-seen timestamp and evaluates the exact duration.
            </p>
          </div>

          <div className="groww-card p-6 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Interval-Aware Volatility</h3>
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
              No generic 5% rules. Moves are normalized against each stock&apos;s statistical volatility over comparable elapsed timeframes.
            </p>
          </div>

          <div className="groww-card p-6 rounded-2xl">
            <div className="w-11 h-11 rounded-xl bg-[#EAF8F3] text-[#00A878] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937]">Data Provenance</h3>
            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
              Transparent confidence metrics, real provider timestamps, freshness validation, and historical time-travel replay.
            </p>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-[#E5E7EB] bg-white py-8 text-center text-xs text-[#9CA3AF]">
        Groww Pulse — Temporal Market Attention Heuristics. Designed with clean, trustworthy Indian fintech aesthetics.
      </footer>
    </div>
  )
}
