import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { WatchlistService } from '@/lib/watchlists/service'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; symbol: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const removed = await WatchlistService.removeSymbolFromWatchlist(params.id, session.userId, params.symbol)
    if (!removed) {
      return NextResponse.json({ data: null, error: 'Symbol not found in watchlist' }, { status: 404 })
    }

    return NextResponse.json({ data: { success: true, symbol: params.symbol }, error: null })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 500 })
  }
}
