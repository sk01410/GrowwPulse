import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'supersecret-groww-pulse-session-key-at-least-32-chars!'
)

const COOKIE_NAME = 'groww_pulse_session'

export interface SessionPayload {
  userId: string
  email: string
  authProviderId: string
  exp?: number
}

export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY)
  return jwt
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      authProviderId: payload.authProviderId as string,
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  // Check authorization header first (Bearer <token>)
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const session = await verifySessionToken(token)
    if (session) return session
  }

  // Check cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value
  if (cookieToken) {
    return verifySessionToken(cookieToken)
  }

  return null
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
