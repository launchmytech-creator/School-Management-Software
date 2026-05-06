-- ============================================
-- Subscription Upgrade/Downgrade Enhancements
-- ============================================

-- 1. Remove Basic plan fee term restriction
UPDATE subscription_plans SET
  allowed_fee_terms = '["yearly", "half-yearly", "quarterly", "monthly"]'::jsonb
WHERE name = 'Basic';

-- 2. Add columns for scheduled downgrades
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS pending_downgrade_plan_id INTEGER REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS pending_downgrade_date DATE;

-- 3. Add credit balance column for excess proration credit
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0.00;

-- 4. Add audit columns to subscription_payments for proration tracking
ALTER TABLE subscription_payments
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS credit_applied DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) DEFAULT 'new_purchase';

-- 5. Set original_amount = amount for existing records (backfill)
UPDATE subscription_payments
SET original_amount = amount, credit_applied = 0.00, payment_type = 'new_purchase'
WHERE original_amount IS NULL;
