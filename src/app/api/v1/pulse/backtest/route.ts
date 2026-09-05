import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth/session'
import { BacktestService } from '@/lib/pulse/backtest.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    const { searchParams } = new URL(request.url)
    const requestedWatchlistId = searchParams.get('watchlistId')

    let symbols: string[] = []
    let watchlistName = 'Active Watchlist'

    // 1. If watchlistId provided, fetch items
    if (requestedWatchlistId) {
      const items = await executeQuery<{ symbol: string }>(
        `SELECT symbol FROM watchlist_items WHERE watchlist_id = $1 ORDER BY created_at ASC`,
        [requestedWatchlistId]
      )
      symbols = items.map((i) => i.symbol)

      const wl = await executeQuery<{ name: string }>(
        `SELECT name FROM watchlists WHERE id = $1`,
        [requestedWatchlistId]
      )
      if (wl[0]) watchlistName = wl[0].name
    } else if (session?.userId) {
      // 2. Fetch user's primary watchlist
      const userWls = await executeQuery<{ id: string; name: string }>(
        `SELECT id, name FROM watchlists WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [session.userId]
      )
      if (userWls[0]) {
        watchlistName = userWls[0].name
        const items = await executeQuery<{ symbol: string }>(
          `SELECT symbol FROM watchlist_items WHERE watchlist_id = $1 ORDER BY created_at ASC`,
          [userWls[0].id]
        )
        symbols = items.map((i) => i.symbol)
      }
    }

    if (symbols.length === 0) {
      symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATASTEEL', 'ZOMATO']
    }

    const scorecard = BacktestService.getModelScorecardForSymbols(symbols, watchlistName)

    return NextResponse.json({
      success: true,
      scorecard,
    })
  } catch (error: any) {
    console.error('Error computing backtest scorecard:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
