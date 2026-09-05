-- Groww Pulse PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_provider_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symbols (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id TEXT PRIMARY KEY,
  watchlist_id TEXT NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  watch_reason TEXT DEFAULT 'JUST_WATCHING',
  target_price NUMERIC(14, 4),
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_watchlist_symbol UNIQUE (watchlist_id, symbol)
);

CREATE TABLE IF NOT EXISTS market_snapshots (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC(14, 4) NOT NULL,
  volume NUMERIC(18, 4),
  source TEXT NOT NULL,
  source_timestamp TIMESTAMPTZ NOT NULL,
  received_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_symbol_time ON market_snapshots(symbol, source_timestamp DESC);

CREATE TABLE IF NOT EXISTS user_symbol_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  last_seen_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_user_symbol_state_user ON user_symbol_state(user_id);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_address TEXT,
  digest_frequency TEXT NOT NULL DEFAULT 'AFTERNOON_DIGEST',
  calm_state_emails BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  push_calm_state BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notification_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_pushed_at TIMESTAMPTZ,
  last_emailed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_push_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
