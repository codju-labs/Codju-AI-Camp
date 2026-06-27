CREATE TABLE IF NOT EXISTS student_portfolios (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  email TEXT NOT NULL COLLATE NOCASE,
  day_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  project_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  tools_used TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL DEFAULT '',
  display_mode TEXT NOT NULL DEFAULT 'link',
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (email, day_key),
  FOREIGN KEY (email) REFERENCES student_portfolios(email)
);

CREATE INDEX IF NOT EXISTS idx_student_portfolios_slug
ON student_portfolios(slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_email_published
ON portfolio_projects(email, is_published);
