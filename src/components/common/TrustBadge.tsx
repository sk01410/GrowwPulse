import React from 'react'
import { ShieldCheck, AlertTriangle, HelpCircle, Activity, Clock, CheckCircle2 } from 'lucide-react'
import { AttentionLevel, ConfidenceLevel } from '@/lib/pulse/engine'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  if (level === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck className="w-3.5 h-3.5" />
        High Confidence
      </span>
    )
  }
  if (level === 'LIMITED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Limited Baseline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
      <HelpCircle className="w-3.5 h-3.5" />
      Insufficient Data
    </span>
  )
}

interface AttentionBadgeProps {
  level: AttentionLevel
}

export function AttentionBadge({ level }: AttentionBadgeProps) {
  if (level === 'HIGH_ATTENTION') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
        High Attention
      </span>
    )
  }
  if (level === 'IMPORTANT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Important
      </span>
    )
  }
  if (level === 'WATCH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Watch
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
      Normal
    </span>
  )
}

interface ProvenanceProps {
  source: string
  observedTimestamp: string
  receivedTimestamp: string
  isFresh: boolean
}

export function ProvenanceDetails({ source, observedTimestamp, receivedTimestamp, isFresh }: ProvenanceProps) {
  return (
    <div className="text-xs text-slate-400 space-y-1.5 p-3 rounded-lg bg-surface-900/90 border border-slate-800 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Source:</span>
        <span className="text-slate-200 font-medium">{source}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Observed:</span>
        <span className="text-slate-200">{new Date(observedTimestamp).toLocaleTimeString()} ({new Date(observedTimestamp).toLocaleDateString()})</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500">Received:</span>
        <span className="text-slate-200">{new Date(receivedTimestamp).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <span className="text-slate-500">Freshness:</span>
        {isFresh ? (
          <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live Data
          </span>
        ) : (
          <span className="text-amber-400 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Stale / Delayed
          </span>
        )}
      </div>
    </div>
  )
}
