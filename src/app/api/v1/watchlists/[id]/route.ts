import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { WatchlistService } from '@/lib/watchlists/service'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const watchlist = await WatchlistService.getWatchlistById(params.id, session.userId)
    if (!watchlist) {
      return NextResponse.json({ data: null, error: 'Watchlist not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { watchlist }, error: null })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const deleted = await WatchlistService.deleteWatchlist(params.id, session.userId)
    if (!deleted) {
      return NextResponse.json({ data: null, error: 'Watchlist not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 500 })
  }
}
