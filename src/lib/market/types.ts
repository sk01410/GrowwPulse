export interface MarketQuote {
  symbol: string
  price: number
  volume: number | null
  source: string
  sourceTimestamp: string
  receivedTimestamp: string
  currency: string
  change?: number
  changePercent?: number
  isStale?: boolean
}

export interface HistoricalObservation {
  symbol: string
  price: number
  volume: number | null
  source: string
  sourceTimestamp: string
  receivedTimestamp: string
}

export interface MarketDataProvider {
  name: string
  getQuote(symbol: string): Promise<MarketQuote>
  getHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
    interval?: '5m' | '15m' | '1h' | '1d'
  ): Promise<HistoricalObservation[]>
}
