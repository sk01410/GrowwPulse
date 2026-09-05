import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth/service'
import { setSessionCookie } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { user, token } = await AuthService.login(email, password)
    setSessionCookie(token)

    return NextResponse.json({
      data: {
        user,
        token,
      },
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { data: null, error: error.message || 'Invalid credentials' },
      { status: 401 }
    )
  }
}
