import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { MarketSnapshotService } from '@/lib/services/market-snapshot.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const interval = (searchParams.get('interval') as any) || '15m'

    if (!symbol) {
      return NextResponse.json({ data: null, error: 'Symbol is required' }, { status: 400 })
    }

    const to = toStr ? new Date(toStr) : new Date()
    const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 24 * 60 * 60 * 1000)

    // Check if we have snapshots in DB
    let snapshots = await MarketSnapshotService.getSnapshotsByRange(symbol, from, to)

    // If insufficient, sync historical from provider
    if (snapshots.length < 5) {
      try {
        await MarketSnapshotService.syncHistoricalData(symbol, from, to, interval)
        snapshots = await MarketSnapshotService.getSnapshotsByRange(symbol, from, to)
      } catch (e) {
        console.warn(`Could not sync live historical for ${symbol}:`, e)
      }
    }

    return NextResponse.json({
      data: {
        symbol,
        count: snapshots.length,
        observations: snapshots,
      },
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message || 'Internal error' },
      { status: 500 }
    )
  }
}
