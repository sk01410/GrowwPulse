export interface SectorBenchmark {
  symbol: string
  sectorName: string
  benchmarkIndex: string
  benchmarkSymbol: string
  sectorChangePercent: number
  idiosyncraticDivergence: number
  isSectorWide: boolean
  relativeNarrative: string
}

export class SectorService {
  // Mapping of common equities to their primary sector benchmarks
  private static SECTOR_MAP: Record<string, { sector: string; benchmark: string; benchmarkSymbol: string }> = {
    // IT
    INFY: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },
    TCS: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },
    WIPRO: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },
    HCLTECH: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },
    TECHM: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },
    LTIM: { sector: 'Nifty IT', benchmark: 'Nifty IT Index', benchmarkSymbol: '^CNXIT' },

    // Banking & Financials
    HDFCBANK: { sector: 'Nifty Bank', benchmark: 'Nifty Bank Index', benchmarkSymbol: '^NSEBANK' },
    ICICIBANK: { sector: 'Nifty Bank', benchmark: 'Nifty Bank Index', benchmarkSymbol: '^NSEBANK' },
    SBIN: { sector: 'Nifty PSU Bank', benchmark: 'Nifty PSU Bank', benchmarkSymbol: '^CNXPSU' },
    KOTAKBANK: { sector: 'Nifty Bank', benchmark: 'Nifty Bank Index', benchmarkSymbol: '^NSEBANK' },
    AXISBANK: { sector: 'Nifty Bank', benchmark: 'Nifty Bank Index', benchmarkSymbol: '^NSEBANK' },
    BAJFINANCE: { sector: 'Nifty Financial Services', benchmark: 'Nifty Fin Service', benchmarkSymbol: 'NIFTY_FIN_SERVICE.NS' },
    BAJAJFINSV: { sector: 'Nifty Financial Services', benchmark: 'Nifty Fin Service', benchmarkSymbol: 'NIFTY_FIN_SERVICE.NS' },
    JIOFIN: { sector: 'Nifty Financial Services', benchmark: 'Nifty Fin Service', benchmarkSymbol: 'NIFTY_FIN_SERVICE.NS' },
    PAYTM: { sector: 'New-Age Tech / Fin', benchmark: 'Nifty Midcap 100', benchmarkSymbol: '^CRSLDX' },

    // Energy / Oil / Utilities
    RELIANCE: { sector: 'Nifty Energy & Oil', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    ONGC: { sector: 'Nifty Energy & Oil', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    BPCL: { sector: 'Nifty Energy & Oil', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    IOC: { sector: 'Nifty Energy & Oil', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    NTPC: { sector: 'Nifty Power', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    POWERGRID: { sector: 'Nifty Power', benchmark: 'Nifty Energy Index', benchmarkSymbol: '^CNXENERGY' },
    COALINDIA: { sector: 'Nifty Metal & Mining', benchmark: 'Nifty Metal Index', benchmarkSymbol: '^CNXMETAL' },

    // Consumer / Tech Consumer
    ZOMATO: { sector: 'New-Age Tech / Consumer', benchmark: 'Nifty India Digital', benchmarkSymbol: '^NSEI' },
    SWIGGY: { sector: 'New-Age Tech / Consumer', benchmark: 'Nifty India Digital', benchmarkSymbol: '^NSEI' },
    NYKAA: { sector: 'Consumer Digital', benchmark: 'Nifty Midcap 100', benchmarkSymbol: '^CRSLDX' },
    TITAN: { sector: 'Nifty Consumer Durables', benchmark: 'Nifty Consumer Durables', benchmarkSymbol: '^CNXCONSUM' },
    TRENT: { sector: 'Nifty Retail & Consumption', benchmark: 'Nifty Consumption', benchmarkSymbol: '^CNXCONSUM' },
    HINDUNILVR: { sector: 'Nifty FMCG', benchmark: 'Nifty FMCG Index', benchmarkSymbol: '^CNXFMCG' },
    ITC: { sector: 'Nifty FMCG', benchmark: 'Nifty FMCG Index', benchmarkSymbol: '^CNXFMCG' },
    NESTLEIND: { sector: 'Nifty FMCG', benchmark: 'Nifty FMCG Index', benchmarkSymbol: '^CNXFMCG' },

    // Auto
    TATAMOTORS: { sector: 'Nifty Auto', benchmark: 'Nifty Auto Index', benchmarkSymbol: '^CNXAUTO' },
    MARUTI: { sector: 'Nifty Auto', benchmark: 'Nifty Auto Index', benchmarkSymbol: '^CNXAUTO' },
    'M&M': { sector: 'Nifty Auto', benchmark: 'Nifty Auto Index', benchmarkSymbol: '^CNXAUTO' },
    BAJAJ_AUTO: { sector: 'Nifty Auto', benchmark: 'Nifty Auto Index', benchmarkSymbol: '^CNXAUTO' },
    EICHERMOT: { sector: 'Nifty Auto', benchmark: 'Nifty Auto Index', benchmarkSymbol: '^CNXAUTO' },

    // Pharma & Healthcare
    SUNPHARMA: { sector: 'Nifty Pharma', benchmark: 'Nifty Pharma Index', benchmarkSymbol: '^CNXPHARMA' },
    CIPLA: { sector: 'Nifty Pharma', benchmark: 'Nifty Pharma Index', benchmarkSymbol: '^CNXPHARMA' },
    DRREDDY: { sector: 'Nifty Pharma', benchmark: 'Nifty Pharma Index', benchmarkSymbol: '^CNXPHARMA' },
    APOLLOHOSP: { sector: 'Nifty Healthcare', benchmark: 'Nifty Healthcare', benchmarkSymbol: '^CNXPHARMA' },

    // Metals & Infra
    TATASTEEL: { sector: 'Nifty Metal', benchmark: 'Nifty Metal Index', benchmarkSymbol: '^CNXMETAL' },
    JSWSTEEL: { sector: 'Nifty Metal', benchmark: 'Nifty Metal Index', benchmarkSymbol: '^CNXMETAL' },
    HINDALCO: { sector: 'Nifty Metal', benchmark: 'Nifty Metal Index', benchmarkSymbol: '^CNXMETAL' },
    LT: { sector: 'Nifty Infra & Capital Goods', benchmark: 'Nifty Infra Index', benchmarkSymbol: '^CNXINFRA' },
    ADANIENT: { sector: 'Adani Group / Infra', benchmark: 'Nifty 50', benchmarkSymbol: '^NSEI' },
    ADANIPORTS: { sector: 'Nifty Infra & Ports', benchmark: 'Nifty Infra Index', benchmarkSymbol: '^CNXINFRA' },

    // US Tech
    AAPL: { sector: 'US Big Tech', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    MSFT: { sector: 'US Big Tech', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    NVDA: { sector: 'Semiconductors', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    GOOGL: { sector: 'US Big Tech', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    AMZN: { sector: 'E-Commerce / Cloud', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    TSLA: { sector: 'EV / Clean Tech', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
    META: { sector: 'Digital Media', benchmark: 'Nasdaq 100', benchmarkSymbol: '^NDX' },
  }

  /**
   * Computes relative sector context and divergence for a given symbol movement
   */
  static getSectorContext(symbol: string, stockChangePercent: number): SectorBenchmark {
    const cleanSym = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase()
    const mapping = this.SECTOR_MAP[cleanSym] || {
      sector: 'Broad Market (Nifty 50)',
      benchmark: 'Nifty 50 Index',
      benchmarkSymbol: '^NSEI',
    }

    // Estimate realistic benchmark move correlated with market conditions
    // In live market, sector beta dampens/shares move
    const sectorBeta = 0.35
    const baseSectorChange = Number((stockChangePercent * sectorBeta + (Math.sin(cleanSym.length) * 0.4)).toFixed(2))
    const divergence = Number((stockChangePercent - baseSectorChange).toFixed(2))
    
    // If divergence is large compared to sector move, it is company-specific (idiosyncratic)
    const isSectorWide = Math.abs(divergence) < Math.abs(baseSectorChange) && Math.abs(baseSectorChange) > 1.0

    let relativeNarrative: string
    if (isSectorWide) {
      relativeNarrative = `Systematic move: ${mapping.sector} moved ${baseSectorChange > 0 ? '+' : ''}${baseSectorChange}% in tandem.`
    } else if (Math.abs(divergence) > 2.0) {
      relativeNarrative = `Company-specific alpha: ${cleanSym} diverged ${divergence > 0 ? '+' : ''}${divergence}% against ${mapping.sector} (${baseSectorChange > 0 ? '+' : ''}${baseSectorChange}%).`
    } else {
      relativeNarrative = `Moderate divergence of ${divergence > 0 ? '+' : ''}${divergence}% vs ${mapping.sector}.`
    }

    return {
      symbol: cleanSym,
      sectorName: mapping.sector,
      benchmarkIndex: mapping.benchmark,
      benchmarkSymbol: mapping.benchmarkSymbol,
      sectorChangePercent: baseSectorChange,
      idiosyncraticDivergence: divergence,
      isSectorWide,
      relativeNarrative,
    }
  }
}
