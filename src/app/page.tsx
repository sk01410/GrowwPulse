import Link from 'next/link'
import { Activity, ArrowRight, ShieldCheck, Clock, Eye, SlidersHorizontal } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-medium tracking-wide uppercase mb-6">
        <Activity className="w-3.5 h-3.5 animate-pulse text-brand-400" />
        Personalized Temporal Market Inbox
      </div>

      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl leading-tight">
        You were away. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400">
          Here&apos;s what matters.
        </span>
      </h1>

      <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        A normal watchlist tells you what&apos;s happening right now. Pulse calculates what changed since you last checked, filters normal market noise, and surfaces what truly deserves your attention.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-surface-950 font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          Open Pulse Inbox
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-900 hover:bg-surface-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all active:scale-95"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
        <div className="card-glass p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Temporal Last-Seen</h3>
          <p className="mt-2 text-sm text-slate-400">
            Never guess what happened while you were offline. Pulse tracks your personal timestamp and analyzes the exact interval.
          </p>
        </div>

        <div className="card-glass p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Interval-Aware Volatility</h3>
          <p className="mt-2 text-sm text-slate-400">
            No naive 5% threshold. Pulse normalizes price movements against each security&apos;s expected statistical movement over comparable timeframes.
          </p>
        </div>

        <div className="card-glass p-6 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Provenance & Trust</h3>
          <p className="mt-2 text-sm text-slate-400">
            Transparent data quality metrics, observed vs received timestamps, confidence scoring, and historical replay verification.
          </p>
        </div>
      </div>
    </main>
  )
}
