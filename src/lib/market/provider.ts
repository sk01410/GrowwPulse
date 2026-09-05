import { MarketDataProvider } from './types'
import { YahooFinanceProvider } from './yahoo-provider'

let defaultProvider: MarketDataProvider | null = null

export function getMarketDataProvider(): MarketDataProvider {
  if (defaultProvider) return defaultProvider
  defaultProvider = new YahooFinanceProvider()
  return defaultProvider
}

export function setMarketDataProvider(provider: MarketDataProvider) {
  defaultProvider = provider
}
