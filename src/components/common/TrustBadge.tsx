import React from 'react'
import { ShieldCheck, AlertTriangle, HelpCircle, Activity, Clock, CheckCircle2 } from 'lucide-react'
import { AttentionLevel, ConfidenceLevel } from '@/lib/pulse/engine'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  if (level === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF8F3] text-[#00A878] border border-[#C6F0E0]">
        <ShieldCheck className="w-3.5 h-3.5" />
        High Confidence
      </span>
    )
  }
  if (level === 'LIMITED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF7E6] text-[#D97706] border border-[#FDE68A]">
        <AlertTriangle className="w-3.5 h-3.5" />
        Limited Baseline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEC] text-[#EB5757] border border-[#FCA5A5]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EB5757]" />
        High Attention
      </span>
    )
  }
  if (level === 'IMPORTANT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7E6] text-[#D97706] border border-[#FDE68A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Important
      </span>
    )
  }
  if (level === 'WATCH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        Watch
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
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
    <div className="text-xs text-[#4B5563] space-y-2 p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Source:</span>
        <span className="text-[#1F2937] font-medium">{source}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Observed Time:</span>
        <span className="text-[#1F2937] font-mono">
          {new Date(observedTimestamp).toLocaleTimeString()} ({new Date(observedTimestamp).toLocaleDateString()})
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[#6B7280]">Received Time:</span>
        <span className="text-[#1F2937] font-mono">{new Date(receivedTimestamp).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
        <span className="text-[#6B7280]">Data Freshness:</span>
        {isFresh ? (
          <span className="text-[#00A878] inline-flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A878]" /> Live Observation
          </span>
        ) : (
          <span className="text-[#D97706] inline-flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> Stale / Delayed
          </span>
        )}
      </div>
    </div>
  )
}
