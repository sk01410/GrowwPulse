import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { PulseService } from '@/lib/services/pulse.service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const watchlistId = searchParams.get('watchlistId') || undefined

    const result = await PulseService.getLivePulse({
      userId: session.userId,
      watchlistId,
    })

    return NextResponse.json({
      data: result,
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to generate pulse' },
      { status: 500 }
    )
  }
}
