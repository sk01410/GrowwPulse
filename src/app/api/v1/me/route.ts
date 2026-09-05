import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import { AuthService } from '@/lib/auth/service'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session || !session.userId) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await AuthService.getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        user,
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
