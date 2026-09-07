ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES profiles(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_transactions_created_by   ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_by ON transactions(processed_by);
CREATE INDEX IF NOT EXISTS idx_transactions_completed_by ON transactions(completed_by);
