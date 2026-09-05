import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { runMigrations } from '@/lib/db/migrate'

let migrationsRan = false

export async function GET() {
  try {
    const db = getDb()
    if (!migrationsRan) {
      await runMigrations()
      migrationsRan = true
    }

    const isHealthy = await db.isHealthy()

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'groww-pulse-api',
      version: '1.0.0',
      database: {
        engine: db.getEngineName(),
        connected: isHealthy,
      },
    }, { status: isHealthy ? 200 : 503 })
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message || 'Internal error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
