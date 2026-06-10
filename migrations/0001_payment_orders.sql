CREATE TABLE IF NOT EXISTS payment_orders (
  order_id TEXT PRIMARY KEY,
  enrollment_id TEXT UNIQUE,
  base_amount TEXT NOT NULL,
  gst_amount TEXT NOT NULL,
  gst_rate TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  tracking_id TEXT,
  bank_ref_no TEXT,
  payment_mode TEXT,
  response_code TEXT,
  response_message TEXT,
  email_status TEXT NOT NULL DEFAULT 'Pending',
  email_contact_id TEXT,
  sheet_status TEXT NOT NULL DEFAULT 'Pending',
  sheet_range TEXT,
  fulfillment_status TEXT NOT NULL DEFAULT 'Pending',
  fulfillment_error TEXT,
  fulfilled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status
ON payment_orders(status);

CREATE INDEX IF NOT EXISTS idx_payment_orders_fulfillment
ON payment_orders(fulfillment_status);
