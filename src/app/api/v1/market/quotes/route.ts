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
    const symbolsParam = searchParams.get('symbols')
    if (!symbolsParam) {
      return NextResponse.json({ data: null, error: 'Symbols parameter is required' }, { status: 400 })
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const quotes = []
    const errors = []

    for (const symbol of symbols) {
      try {
        const quote = await MarketSnapshotService.syncQuote(symbol)
        quotes.push(quote)
      } catch (err: any) {
        errors.push({ symbol, error: err.message || 'Failed to fetch quote' })
      }
    }

    return NextResponse.json({
      data: {
        quotes,
        errors,
        freshness: quotes.map(q => ({
          symbol: q.symbol,
          isFresh: MarketSnapshotService.isFresh(q.sourceTimestamp),
          sourceTimestamp: q.sourceTimestamp,
          receivedTimestamp: q.receivedTimestamp,
        })),
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
