import React from 'react'
import { ShieldCheck, AlertTriangle, HelpCircle, Activity, Clock, CheckCircle2 } from 'lucide-react'
import { AttentionLevel, ConfidenceLevel } from '@/lib/pulse/engine'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  if (level === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBFCF7] text-[#00D09C] border border-[#B2F0E1]">
        <ShieldCheck className="w-3.5 h-3.5" />
        High Confidence
      </span>
    )
  }
  if (level === 'LIMITED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Limited Baseline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#6B7280] border border-[#E8ECF2]">
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
        High Attention
      </span>
    )
  }
  if (level === 'IMPORTANT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E5F4FD] text-[#5367F5] border border-[#B1D0FB]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5367F5]" />
        Important
      </span>
    )
  }
  if (level === 'WATCH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Watch
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#6B7280] border border-[#E8ECF2]">
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
    <div className="text-xs text-[#4B5563] space-y-2 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E8ECF2]">
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Source:</span>
        <span className="text-[#111827] font-medium">{source}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Observed Time:</span>
        <span className="text-[#111827] font-mono">
          {new Date(observedTimestamp).toLocaleTimeString()} ({new Date(observedTimestamp).toLocaleDateString()})
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Received Time:</span>
        <span className="text-[#111827] font-mono">{new Date(receivedTimestamp).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#E8ECF2]">
        <span className="text-[#6B7280]">Data Freshness:</span>
        {isFresh ? (
          <span className="text-[#00D09C] inline-flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C]" /> Live Observation
          </span>
        ) : (
          <span className="text-[#D97706] inline-flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5" /> Cached / Baseline
          </span>
        )}
      </div>
    </div>
  )
}
