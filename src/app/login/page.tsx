'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, ArrowRight, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F8F9FA]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F3] border border-[#C6F0E0] flex items-center justify-center text-[#00B386]">
              <Activity className="w-5 h-5 text-[#00B386]" />
            </div>
            <span className="text-xl font-bold text-[#1F2937] tracking-tight">
              Groww <span className="text-[#00B386]">Pulse</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">Welcome to Groww Pulse</h2>
          <p className="mt-1.5 text-sm text-[#6B7280]">Sign in to check what changed while you were away</p>
        </div>

        <div className="groww-card p-8 rounded-2xl shadow-sm bg-white border border-[#E5E7EB]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FDECEC] border border-[#FCA5A5] flex items-center gap-3 text-[#EB5757] text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@groww.in"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:bg-white focus:border-[#00B386] focus:ring-3 focus:ring-[#E8F8F3] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] text-sm focus:outline-none focus:bg-white focus:border-[#00B386] focus:ring-3 focus:ring-[#E8F8F3] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E7EB] text-center text-xs text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#00B386] hover:underline font-bold">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
