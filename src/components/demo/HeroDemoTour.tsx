'use client'

import { useState } from 'react'
import {
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  Clock,
  Activity,
  Newspaper,
  Layers,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function HeroDemoTour({ isOpen, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  if (!isOpen) return null

  const handleFinish = () => {
    onClose()
    setStep(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E7EB] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Accent Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#E8F8F3] via-transparent to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-5 right-5 p-2 rounded-full text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#F3F4F6] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-[#009B75]'
                  : s < step
                  ? 'w-4 bg-[#009B75]/40'
                  : 'w-4 bg-[#E5E7EB]'
              }`}
            />
          ))}
          <span className="text-[11px] font-bold text-[#9CA3AF] ml-2">
            Step {step} of 3
          </span>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F8F3] border border-[#C6F0E0] text-[#009B75] flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">
              1. The &quot;Away&quot; Framing
            </h2>
            <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
              Traditional market dashboards overwhelm you with constant flashing tickers. 
              <strong> GrowwPulse changes the paradigm:</strong> it measures exactly what happened between the moment you last checked and right now.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2">
              <div className="text-xs font-semibold text-[#1F2937] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#009B75]" />
                Simulated Lookback Window: 4 Hours Away
              </div>
              <p className="text-xs text-[#6B7280]">
                Pulse reads your last-seen state per stock, eliminates non-trading weekend/night gaps, and establishes an empirical baseline.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">
              2. The Statistical Noise Filter
            </h2>
            <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
              A 2% move in TCS is massive; a 2% move in a high-beta stock is routine. 
              Pulse computes expected volatility (historical interval variance) for your exact away duration.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#1F2937]">8 Stocks in Watchlist</span>
                <span className="text-[#009B75] bg-[#E8F8F3] px-2 py-0.5 rounded">6 Muted as Noise</span>
              </div>
              <div className="text-xs text-[#4B5563]">
                Only 2 movements exceeded ±2.0× normal statistical bounds and were prioritized to protect your attention.
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">
              3. The &quot;Why Should I Care&quot; Layer
            </h2>
            <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
              We close the loop by explaining <strong>why it moved</strong> and <strong>whether it was company-specific alpha or sector tide</strong>:
            </p>

            <div className="mt-4 space-y-2.5">
              <div className="p-3 rounded-xl bg-[#E8F8F3]/60 border border-[#C6F0E0] text-xs">
                <div className="font-bold text-[#009B75] flex items-center gap-1.5 mb-1">
                  <Newspaper className="w-3.5 h-3.5" /> Likely Catalyst Correlated
                </div>
                <div className="text-[#1F2937] font-medium">
                  &quot;Institutional block trade &amp; quarterly volume surge reported on NSE&quot;
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F0F3F7] border border-[#E5E7EB] text-xs">
                <div className="font-bold text-[#4B5563] flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" /> Sector Alpha Divergence
                </div>
                <div className="text-[#4B5563]">
                  Stock +4.85% vs Nifty Energy +1.20% (<strong>+3.65% Idiosyncratic Alpha</strong>)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="btn-secondary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Start Exploring
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
