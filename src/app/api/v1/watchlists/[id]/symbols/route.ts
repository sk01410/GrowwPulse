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

    const wl = await WatchlistService.getWatchlistById(params.id, session.userId)
    if (!wl) {
      return NextResponse.json({ data: null, error: 'Watchlist not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { symbols: wl.items || [] }, error: null })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { symbol, watchReason, targetPrice } = body

    if (!symbol) {
      return NextResponse.json({ data: null, error: 'Symbol is required' }, { status: 400 })
    }

    const item = await WatchlistService.addSymbolToWatchlist(
      params.id,
      session.userId,
      symbol,
      watchReason || 'JUST_WATCHING',
      targetPrice !== undefined && targetPrice !== null && targetPrice !== '' ? Number(targetPrice) : null
    )
    return NextResponse.json({ data: { item }, error: null }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 400 })
  }
}
