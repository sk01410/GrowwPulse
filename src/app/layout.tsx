import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Groww Pulse — Personalized Temporal Market Inbox',
  description: 'You were away. Here is what changed, what was unusual, and what matters in your watchlist.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-slate-100 flex flex-col selection:bg-brand-500/20 selection:text-brand-300">
        {children}
      </body>
    </html>
  )
}
