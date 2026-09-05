import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { SeenService } from '@/lib/services/seen.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { symbol } = body

    if (!symbol) {
      return NextResponse.json({ data: null, error: 'Symbol is required' }, { status: 400 })
    }

    const res = await SeenService.markSymbolSeen(session.userId, symbol)
    return NextResponse.json({
      data: res,
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message || 'Internal error' },
      { status: 500 }
    )
  }
}
