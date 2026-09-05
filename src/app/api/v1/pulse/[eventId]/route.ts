import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { PulseService } from '@/lib/services/pulse.service'
import { MarketSnapshotService } from '@/lib/services/market-snapshot.service'

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = params
    // eventId format: evt_{SYMBOL}_{REF_TIMESTAMP}_{EVAL_TIMESTAMP}
    const parts = eventId.split('_')
    if (parts.length < 4) {
      return NextResponse.json({ data: null, error: 'Invalid event identifier' }, { status: 400 })
    }

    const symbol = parts[1].toUpperCase()
    const refMs = parseInt(parts[2], 10)
    const evalMs = parseInt(parts[3], 10)

    if (isNaN(refMs) || isNaN(evalMs)) {
      return NextResponse.json({ data: null, error: 'Invalid event timestamps' }, { status: 400 })
    }

    const referenceTime = new Date(refMs)
    const evaluationTime = new Date(evalMs)

    // Retrieve live pulse or evaluate specific window
    const pulseResult = await PulseService.getReplayPulse({
      userId: session.userId,
      referenceTime,
      evaluationTime,
    })

    const event = pulseResult.events.find(e => e.symbol === symbol)
    if (!event) {
      return NextResponse.json({ data: null, error: 'Event not found in user watchlist' }, { status: 404 })
    }

    // Fetch chart points: 24 hours lookback to evaluationTime
    const chartStart = new Date(referenceTime.getTime() - 24 * 60 * 60 * 1000)
    const snapshots = await MarketSnapshotService.getSnapshotsByRange(symbol, chartStart, evaluationTime)

    const chartData = snapshots.map(s => ({
      time: Math.floor(new Date(s.source_timestamp).getTime() / 1000),
      value: Number(s.price),
      volume: s.volume !== null ? Number(s.volume) : undefined,
    }))

    return NextResponse.json({
      data: {
        event,
        chartData,
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
