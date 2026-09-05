import { NextRequest, NextResponse } from 'next/server'
import { WatchlistService } from '@/lib/watchlists/service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const symbols = await WatchlistService.searchSymbols(q)

    return NextResponse.json({
      data: {
        symbols,
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
