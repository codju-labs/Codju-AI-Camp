CREATE TABLE IF NOT EXISTS portal_access (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  order_id TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES payment_orders(order_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
  email TEXT NOT NULL COLLATE NOCASE,
  level_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (email, level_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_email_status
ON payment_orders(email, status);
