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
    <html lang="en">
      <body className="min-h-screen bg-[#F8F9FA] text-[#1F2937] flex flex-col selection:bg-[#E8F8F3] selection:text-[#009B75]">
        {children}
      </body>
    </html>
  )
}
