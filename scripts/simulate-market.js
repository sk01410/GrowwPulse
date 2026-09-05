#!/usr/bin/env node

/**
 * GrowwPulse Market Simulator CLI
 * 
 * Usage:
 *   npm run simulate -- --test    (Injects an anomalous movement into a random watchlist stock)
 *   npm run simulate -- --flush   (Flushes simulated test points and restores genuine market data)
 */

const fs = require('fs');
const path = require('path');

const storagePath = path.resolve(process.cwd(), '.data/pulse_storage.json');

const isTestFlag = process.argv.includes('--test') || process.argv.includes('-t');
const isFlushFlag = process.argv.includes('--flush') || process.argv.includes('-f') || process.argv.includes('--reset');

if (!isTestFlag && !isFlushFlag) {
  console.log(`
\x1b[36mGrowwPulse Market Simulator\x1b[0m
---------------------------------------------
Usage:
  \x1b[32mnode scripts/simulate-market.js --test\x1b[0m   Inject a statistically unusual move into a random watchlist stock
  \x1b[33mnode scripts/simulate-market.js --flush\x1b[0m  Remove all simulated data and restore genuine market prices
`);
  process.exit(0);
}

if (!fs.existsSync(storagePath)) {
  console.error('\x1b[31mError:\x1b[0m Storage file .data/pulse_storage.json not found. Run the app first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
if (!data.market_snapshots) {
  data.market_snapshots = [];
}

// -------------------------------------------------------------
// FLUSH MODE
// -------------------------------------------------------------
if (isFlushFlag) {
  const initialCount = data.market_snapshots.length;
  data.market_snapshots = data.market_snapshots.filter(s => 
    s.source !== 'SimulatedAnomaly' && 
    !s.is_simulated &&
    s.source !== 'TestMarketProvider' &&
    s.source !== 'Test'
  );
  const removedCount = initialCount - data.market_snapshots.length;

  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`\n\x1b[32m✔ Flushed ${removedCount} simulated test snapshot(s).\x1b[0m`);
  console.log(`\x1b[36mMarket data is now restored to 100% genuine historical/live quotes.\x1b[0m`);
  console.log(`Refresh your dashboard at: \x1b[4mhttp://localhost:3000/dashboard\x1b[0m\n`);
  process.exit(0);
}

// -------------------------------------------------------------
// TEST SIMULATION MODE
// -------------------------------------------------------------
if (isTestFlag) {
  // Support optional --symbol flag
  const symbolArgIdx = process.argv.findIndex(a => a === '--symbol' || a === '-s');
  let forcedSymbol = symbolArgIdx !== -1 && process.argv[symbolArgIdx + 1] ? process.argv[symbolArgIdx + 1].toUpperCase() : null;

  // Get active symbols from watchlist or existing snapshots
  let symbols = [];
  if (data.watchlist_items && data.watchlist_items.length > 0) {
    symbols = [...new Set(data.watchlist_items.map(i => i.symbol.toUpperCase()))]
      .filter(s => !s.includes('_'));
  }
  if (symbols.length === 0 && data.symbols && data.symbols.length > 0) {
    symbols = data.symbols.map(s => s.symbol.toUpperCase())
      .filter(s => !s.includes('_'));
  }
  if (symbols.length === 0) {
    symbols = ['RELIANCE', 'INFY', 'TCS', 'HDFCBANK'];
  }

  // Pick symbol
  const selectedSymbol = forcedSymbol || symbols[Math.floor(Math.random() * symbols.length)];

  // Find latest snapshot for this symbol
  const symbolSnapshots = data.market_snapshots
    .filter(s => s.symbol.toUpperCase() === selectedSymbol)
    .sort((a, b) => new Date(b.source_timestamp).getTime() - new Date(a.source_timestamp).getTime());

  const basePrice = symbolSnapshots.length > 0 ? Number(symbolSnapshots[0].price) : (selectedSymbol === 'RELIANCE' ? 1322 : selectedSymbol === 'INFY' ? 1130 : selectedSymbol === 'TCS' ? 2304 : selectedSymbol === 'HDFCBANK' ? 712 : 1000.0);
  const baseVolume = symbolSnapshots.length > 0 ? (symbolSnapshots[0].volume || 250000) : 250000;

  // Decide anomalous jump direction (+4.2% to +6.5% or -3.8% to -5.5%)
  const isUp = Math.random() > 0.4;
  const pctChange = isUp
    ? +(3.8 + Math.random() * 2.7).toFixed(2)
    : -(3.5 + Math.random() * 2.2).toFixed(2);

  const newPrice = +(basePrice * (1 + pctChange / 100)).toFixed(2);
  const newVolume = Math.round(baseVolume * (2.2 + Math.random() * 1.5));

  const now = new Date();
  const simulatedSnapshot = {
    id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    symbol: selectedSymbol,
    price: newPrice,
    volume: newVolume,
    source: 'SimulatedAnomaly',
    source_timestamp: now.toISOString(),
    received_timestamp: new Date(now.getTime() + 500).toISOString(),
    is_simulated: true,
    simulated_pct_change: pctChange,
  };

  data.market_snapshots.push(simulatedSnapshot);
  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`
\x1b[32m✔ Simulated Market Anomaly Injected!\x1b[0m
---------------------------------------------
  \x1b[1mStock Symbol:\x1b[0m     \x1b[36m${selectedSymbol}\x1b[0m
  \x1b[1mPrevious Price:\x1b[0m   ₹${basePrice.toFixed(2)}
  \x1b[1mSimulated Price:\x1b[0m  ₹${newPrice.toFixed(2)} (\x1b[${pctChange >= 0 ? '32m+' : '31m'}${pctChange}%\x1b[0m)
  \x1b[1mVolume Surge:\x1b[0m     ${(newVolume / baseVolume).toFixed(1)}× normal volume
  \x1b[1mTimestamp:\x1b[0m        ${now.toLocaleTimeString()} (${now.toLocaleDateString()})

\x1b[33mHow to observe:\x1b[0m
  1. Open \x1b[4mhttp://localhost:3000/dashboard\x1b[0m and click the refresh icon.
  2. Pulse will detect this as an unusual attention-worthy anomaly with full explanation!
  3. To reset back to genuine market data, run:
     \x1b[32mnpm run simulate -- --flush\x1b[0m
`);
}
