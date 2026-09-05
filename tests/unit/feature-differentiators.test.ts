import { describe, it, expect } from 'vitest';
import { PulseEngine, SymbolExtraContext } from '../../src/lib/pulse/engine';
import { HistoricalObservation } from '../../src/lib/market/types';
import { sendPulseEmailDigest } from '../../src/lib/notifications/brevo';

describe('Differentiator Features - Intent Tagging, Muting, Reassurance, and Brevo Email', () => {
  const baseTime = new Date('2026-09-05T09:15:00Z').getTime();

  function createObservations(symbol: string, prices: number[]): HistoricalObservation[] {
    return prices.map((price, idx) => ({
      symbol,
      price,
      volume: 50000 + (idx % 3) * 10000,
      source: 'TestProvider',
      sourceTimestamp: new Date(baseTime + idx * 15 * 60 * 1000).toISOString(),
      receivedTimestamp: new Date(baseTime + idx * 15 * 60 * 1000 + 1000).toISOString(),
    }));
  }

  const reliancePrices = [
    1200, 1202, 1201, 1203, 1200, 1204, 1202, 1205, 1203, 1204,
    1202, 1205, 1203, 1206, 1204, 1205, 1203, 1206, 1204, 1200,
    1250, 1300, 1330, 1350 // Big upward jump (+12.5%)
  ];

  const tcsPrices = [
    3500, 3502, 3501, 3503, 3500, 3504, 3502, 3505, 3503, 3504,
    3502, 3505, 3503, 3506, 3504, 3505, 3503, 3506, 3504, 3500,
    3501, 3502, 3503, 3505 // Tiny normal move (+0.14%)
  ];

  const refTime = new Date(baseTime + 19 * 15 * 60 * 1000);
  const evalTime = new Date(baseTime + 23 * 15 * 60 * 1000);

  it('generates tailored explanation when intent is PRICE_TARGET', () => {
    const obsMap = new Map<string, HistoricalObservation[]>([
      ['RELIANCE', createObservations('RELIANCE', reliancePrices)],
    ]);

    const ctxMap = new Map<string, SymbolExtraContext>([
      ['RELIANCE', { watchReason: 'PRICE_TARGET', targetPrice: 1300.0 }],
    ]);

    const result = PulseEngine.evaluateWatchlist(refTime, evalTime, obsMap, undefined, ctxMap);
    expect(result.rankedEvents.length).toBe(1);
    const relEvent = result.rankedEvents[0];
    expect(relEvent.watchReason).toBe('PRICE_TARGET');
    expect(relEvent.targetPrice).toBe(1300.0);
    expect(relEvent.explanation).toContain('hit ₹1,300');
  });

  it('generates tailored explanation when intent is OWN_IT (portfolio holding)', () => {
    const obsMap = new Map<string, HistoricalObservation[]>([
      ['RELIANCE', createObservations('RELIANCE', reliancePrices)],
    ]);

    const ctxMap = new Map<string, SymbolExtraContext>([
      ['RELIANCE', { watchReason: 'OWN_IT' }],
    ]);

    const result = PulseEngine.evaluateWatchlist(refTime, evalTime, obsMap, undefined, ctxMap);
    const relEvent = result.rankedEvents[0];
    expect(relEvent.watchReason).toBe('OWN_IT');
    expect(relEvent.explanation).toContain('You own this stock');
  });

  it('generates tailored explanation when intent is CONSIDERING_BUY', () => {
    const obsMap = new Map<string, HistoricalObservation[]>([
      ['RELIANCE', createObservations('RELIANCE', reliancePrices)],
    ]);

    const ctxMap = new Map<string, SymbolExtraContext>([
      ['RELIANCE', { watchReason: 'CONSIDERING_BUY' }],
    ]);

    const result = PulseEngine.evaluateWatchlist(refTime, evalTime, obsMap, undefined, ctxMap);
    const relEvent = result.rankedEvents[0];
    expect(relEvent.watchReason).toBe('CONSIDERING_BUY');
    expect(relEvent.explanation).toContain('considering buying this');
  });

  it('excludes muted symbols from attentionCount and rankedEvents, and marks them in normalEvents', () => {
    const mutedUntilFuture = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const obsMap = new Map<string, HistoricalObservation[]>([
      ['RELIANCE', createObservations('RELIANCE', reliancePrices)],
      ['TCS', createObservations('TCS', tcsPrices)],
    ]);

    const ctxMap = new Map<string, SymbolExtraContext>([
      ['RELIANCE', { mutedUntil: mutedUntilFuture }],
    ]);

    const result = PulseEngine.evaluateWatchlist(refTime, evalTime, obsMap, undefined, ctxMap);
    // RELIANCE is muted, so 0 attention count
    expect(result.summary.attentionCount).toBe(0);
    expect(result.rankedEvents.length).toBe(0);
    expect(result.normalEvents.length).toBe(2);

    const mutedEvent = result.normalEvents.find(e => e.symbol === 'RELIANCE');
    expect(mutedEvent).toBeDefined();
    expect(mutedEvent?.isMuted).toBe(true);
  });

  it('produces zero-alert calm summary when attention count is 0', () => {
    const obsMap = new Map<string, HistoricalObservation[]>([
      ['TCS', createObservations('TCS', tcsPrices)],
    ]);

    const result = PulseEngine.evaluateWatchlist(
      refTime,
      evalTime,
      obsMap,
      undefined,
      undefined,
      '0 stocks moved outside normal bounds.'
    );
    expect(result.summary.attentionCount).toBe(0);
    expect(result.rankedEvents.length).toBe(0);
    expect(result.summary.marketHeadline).toBe('0 stocks moved outside normal bounds.');
  });

  it('generates Brevo transactional email digest with Groww styling', async () => {
    const emailResult = await sendPulseEmailDigest({
      toEmail: 'test@growwpulse.local',
      userName: 'Sukhad',
      subject: 'GrowwPulse: All quiet across your watchlist',
      headline: '0 stocks moved outside normal bounds',
      absenceDuration: '2h 15m',
      attentionItems: [],
      calmSummary: 'None of your watchlist stocks made unusual or statistically significant moves during your absence.',
      niftyContext: 'Nifty 50 moved +0.32% during this period.',
      dashboardUrl: 'http://localhost:3000/dashboard',
    });

    expect(emailResult.success).toBe(true);
    expect(emailResult.messageId).toBeDefined();
  });
});
