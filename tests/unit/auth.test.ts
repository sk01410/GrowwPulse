import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from '@/lib/auth/service'
import { createSessionToken, verifySessionToken } from '@/lib/auth/session'
import { runMigrations } from '@/lib/db/migrate'

describe('Phase 1: Authentication & User Identity', () => {
  beforeEach(async () => {
    await runMigrations()
  })

  it('should sign up a user and issue a valid session token', async () => {
    const email = `trader_${Date.now()}@groww.in`
    const { user, token } = await AuthService.signup(email, 'securePassword123')

    expect(user.id).toBeDefined()
    expect(user.email).toBe(email)
    expect(user.auth_provider_id).toBeDefined()

    const session = await verifySessionToken(token)
    expect(session).not.toBeNull()
    expect(session?.userId).toBe(user.id)
    expect(session?.email).toBe(email)
  })

  it('should authenticate an existing user and restore the exact same identity', async () => {
    const email = `returning_${Date.now()}@groww.in`
    const created = await AuthService.signup(email, 'myPassword!2026')

    const loggedIn = await AuthService.login(email, 'myPassword!2026')
    expect(loggedIn.user.id).toBe(created.user.id)
    expect(loggedIn.user.email).toBe(email)
    expect(loggedIn.user.auth_provider_id).toBe(created.user.auth_provider_id)
  })

  it('should reject invalid password for protected accounts', async () => {
    const email = `secure_${Date.now()}@groww.in`
    await AuthService.signup(email, 'correctPassword')

    await expect(AuthService.login(email, 'wrongPassword')).rejects.toThrow('Invalid credentials')
  })
})
