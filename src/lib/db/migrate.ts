import fs from 'fs'
import path from 'path'
import { getDb } from './index'

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDb()
    const schemaPath = path.resolve(process.cwd(), 'src/lib/db/schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')

    // Split statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const stmt of statements) {
      await db.query(stmt)
    }

    // Seed default supported Indian and Global symbols if empty
    const symbols = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', currency: 'INR' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'ITC', name: 'ITC Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', currency: 'INR' },
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD' },
    ]

    for (const s of symbols) {
      await db.query(
        `INSERT INTO symbols (symbol, name, exchange, currency, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (symbol) DO NOTHING`,
        [s.symbol, s.name, s.exchange, s.currency]
      )
    }

    return {
      success: true,
      message: `Migrations executed successfully using engine: ${db.getEngineName()}`,
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return {
      success: false,
      message: error.message || 'Unknown migration error',
    }
  }
}
