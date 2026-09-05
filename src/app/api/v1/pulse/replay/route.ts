import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { PulseService } from '@/lib/services/pulse.service'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { referenceTime, evaluationTime, watchlistId } = body

    if (!referenceTime) {
      return NextResponse.json({ data: null, error: 'referenceTime is required for replay' }, { status: 400 })
    }

    const refDate = new Date(referenceTime)
    const evalDate = evaluationTime ? new Date(evaluationTime) : new Date()

    if (isNaN(refDate.getTime()) || isNaN(evalDate.getTime())) {
      return NextResponse.json({ data: null, error: 'Invalid timestamp format' }, { status: 400 })
    }

    if (refDate >= evalDate) {
      return NextResponse.json({ data: null, error: 'referenceTime must be earlier than evaluationTime' }, { status: 400 })
    }

    const result = await PulseService.getReplayPulse({
      userId: session.userId,
      watchlistId,
      referenceTime: refDate,
      evaluationTime: evalDate,
    })

    return NextResponse.json({
      data: {
        isReplay: true,
        referenceTime: refDate.toISOString(),
        evaluationTime: evalDate.toISOString(),
        ...result,
      },
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message || 'Replay computation failed' },
      { status: 500 }
    )
  }
}
