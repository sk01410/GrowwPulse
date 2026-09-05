import { MarketDataProvider, MarketQuote, HistoricalObservation } from './types'

export class YahooFinanceProvider implements MarketDataProvider {
  name = 'YahooFinance'

  private formatSymbol(symbol: string): string {
    const s = symbol.trim().toUpperCase()
    // If it's a known US symbol, keep as is
    if (['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'SPY', 'QQQ'].includes(s)) {
      return s
    }
    // If already has suffix, return
    if (s.includes('.')) return s
    // Default Indian market stocks to National Stock Exchange (.NS)
    return `${s}.NS`
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const formatted = this.formatSymbol(symbol)
    const receivedTimestamp = new Date().toISOString()
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?interval=1m&range=1d`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Market data provider returned HTTP ${res.status} for ${symbol}`)
      }

      const json = await res.json()
      const result = json?.chart?.result?.[0]
      if (!result) {
        throw new Error(`No market data found for symbol: ${symbol}`)
      }

      const meta = result.meta
      const price = meta.regularMarketPrice ?? meta.previousClose ?? 0
      const sourceTimestamp = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : receivedTimestamp

      const quote: MarketQuote = {
        symbol: symbol.toUpperCase(),
        price: Number(price),
        volume: meta.regularMarketVolume !== undefined ? Number(meta.regularMarketVolume) : null,
        source: this.name,
        sourceTimestamp,
        receivedTimestamp,
        currency: meta.currency || 'INR',
        change: meta.regularMarketPrice && meta.previousClose ? meta.regularMarketPrice - meta.previousClose : 0,
        changePercent: meta.regularMarketPrice && meta.previousClose
          ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
          : 0,
      }

      return quote
    } finally {
      clearTimeout(timeout)
    }
  }

  async getHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
    interval: '5m' | '15m' | '1h' | '1d' = '15m'
  ): Promise<HistoricalObservation[]> {
    const formatted = this.formatSymbol(symbol)
    const period1 = Math.floor(from.getTime() / 1000)
    const period2 = Math.floor(to.getTime() / 1000)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?period1=${period1}&period2=${period2}&interval=${interval}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch historical market data for ${symbol}: HTTP ${res.status}`)
      }

      const json = await res.json()
      const result = json?.chart?.result?.[0]
      if (!result || !result.timestamp) {
        return []
      }

      const timestamps: number[] = result.timestamp
      const quotes = result.indicators?.quote?.[0]
      const closes: (number | null)[] = quotes?.close || []
      const volumes: (number | null)[] = quotes?.volume || []

      const observations: HistoricalObservation[] = []
      const receivedTimestamp = new Date().toISOString()

      for (let i = 0; i < timestamps.length; i++) {
        const p = closes[i]
        if (p !== null && p !== undefined && !isNaN(p) && p > 0) {
          observations.push({
            symbol: symbol.toUpperCase(),
            price: Number(p),
            volume: volumes[i] !== null && volumes[i] !== undefined ? Number(volumes[i]) : null,
            source: this.name,
            sourceTimestamp: new Date(timestamps[i] * 1000).toISOString(),
            receivedTimestamp,
          })
        }
      }

      return observations
    } finally {
      clearTimeout(timeout)
    }
  }
}
