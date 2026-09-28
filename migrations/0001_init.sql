-- CúperOS telemetry. Deliberately minimal: no IPs, no user agents, no cookies.
-- A session id is random per browser tab and never persisted beyond it.
CREATE TABLE IF NOT EXISTS sessions (
  sid        TEXT PRIMARY KEY,
  first_ts   INTEGER NOT NULL,
  last_ts    INTEGER NOT NULL,
  day        TEXT NOT NULL,
  country    TEXT,
  device     TEXT,
  ref        TEXT,
  is_return  INTEGER NOT NULL DEFAULT 0,
  entry      TEXT
);
CREATE INDEX IF NOT EXISTS sessions_last ON sessions(last_ts);
CREATE INDEX IF NOT EXISTS sessions_day ON sessions(day);

CREATE TABLE IF NOT EXISTS events (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,
  day     TEXT NOT NULL,
  sid     TEXT NOT NULL,
  type    TEXT NOT NULL,
  target  TEXT
);
CREATE INDEX IF NOT EXISTS events_type_target ON events(type, target);
CREATE INDEX IF NOT EXISTS events_day ON events(day);
