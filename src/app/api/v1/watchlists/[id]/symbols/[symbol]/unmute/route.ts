import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { WatchlistService } from '@/lib/watchlists/service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; symbol: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const result = await WatchlistService.unmuteSymbol(
      params.id,
      session.userId,
      params.symbol
    )

    return NextResponse.json({ data: result, error: null }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: error.message || 'Internal error' }, { status: 400 })
  }
}
