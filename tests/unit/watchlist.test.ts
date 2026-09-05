import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService } from '@/lib/auth/service'
import { WatchlistService } from '@/lib/watchlists/service'
import { runMigrations } from '@/lib/db/migrate'

describe('Phase 2: Persistent Watchlists & Isolation', () => {
  beforeEach(async () => {
    await runMigrations()
  })

  it('should create watchlists, add symbols and enforce single-user isolation', async () => {
    // 1. Create User A and User B
    const userA = await AuthService.signup(`userA_${Date.now()}@groww.in`, 'pass123')
    const userB = await AuthService.signup(`userB_${Date.now()}@groww.in`, 'pass123')

    // 2. Create custom watchlist for User A
    const wlA = await WatchlistService.createWatchlist(userA.user.id, 'High Beta Tech')
    expect(wlA.id).toBeDefined()
    expect(wlA.name).toBe('High Beta Tech')

    // 3. Add symbols to User A watchlist
    await WatchlistService.addSymbolToWatchlist(wlA.id, userA.user.id, 'TATAMOTORS')
    await WatchlistService.addSymbolToWatchlist(wlA.id, userA.user.id, 'HDFCBANK')

    const loadedA = await WatchlistService.getWatchlistById(wlA.id, userA.user.id)
    expect(loadedA?.items?.some(i => i.symbol === 'TATAMOTORS')).toBe(true)
    expect(loadedA?.items?.some(i => i.symbol === 'HDFCBANK')).toBe(true)

    // 4. Security Invariant (Section 171 & 187): User B CANNOT access User A's watchlist
    const accessB = await WatchlistService.getWatchlistById(wlA.id, userB.user.id)
    expect(accessB).toBeNull()

    // 5. Remove symbol from User A watchlist
    const removed = await WatchlistService.removeSymbolFromWatchlist(wlA.id, userA.user.id, 'HDFCBANK')
    expect(removed).toBe(true)

    const updatedA = await WatchlistService.getWatchlistById(wlA.id, userA.user.id)
    expect(updatedA?.items?.some(i => i.symbol === 'HDFCBANK')).toBe(false)
  })

  it('should search supported symbols', async () => {
    const results = await WatchlistService.searchSymbols('RELI')
    expect(results.some(s => s.symbol === 'RELIANCE')).toBe(true)
  })
})
