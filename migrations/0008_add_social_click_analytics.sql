-- Migration: 0008_add_social_click_analytics
-- Description: Track social/contact clicks. Adds a 'social_click' event type and a
--   social_platform column to analytics_events.
-- Backward compatible: SQLite cannot alter a CHECK constraint, so the table is rebuilt
--   and all existing rows are copied verbatim. No data is deleted.

CREATE TABLE IF NOT EXISTS analytics_events_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id TEXT REFERENCES links(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('profile_view', 'link_click', 'social_click')),
  social_platform TEXT,
  user_agent TEXT,
  referrer TEXT,
  ip_hash TEXT, -- SHA-256 hashed IP for privacy
  country_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO analytics_events_new (
  id, user_id, link_id, event_type, social_platform,
  user_agent, referrer, ip_hash, country_code, created_at
)
SELECT
  id, user_id, link_id, event_type, NULL,
  user_agent, referrer, ip_hash, country_code, created_at
FROM analytics_events;

DROP TABLE analytics_events;

ALTER TABLE analytics_events_new RENAME TO analytics_events;

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_link_user ON analytics_events(link_id, user_id);

SELECT 'Migration 0008_add_social_click_analytics completed successfully' as message;
