-- ============================================
-- Subscription Enhancements - Pricing & Fee Terms
-- ============================================

-- Add pricing and fee term restrictions to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS price_yearly DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_half_yearly DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_quarterly DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS allowed_fee_terms JSONB DEFAULT '["yearly"]';

-- Set allowed fee terms per plan
UPDATE subscription_plans SET 
  allowed_fee_terms = '["yearly"]'::jsonb
WHERE name = 'Basic';

UPDATE subscription_plans SET 
  allowed_fee_terms = '["yearly", "half-yearly", "quarterly", "monthly"]'::jsonb
WHERE name IN ('Premium', 'Business');

-- Set default prices (placeholder - update with actual pricing)
UPDATE subscription_plans SET 
  price_yearly = 99.00,
  price_half_yearly = 55.00,
  price_quarterly = 30.00,
  price_monthly = 10.00
WHERE name = 'Basic';

UPDATE subscription_plans SET 
  price_yearly = 199.00,
  price_half_yearly = 110.00,
  price_quarterly = 60.00,
  price_monthly = 20.00
WHERE name = 'Premium';

UPDATE subscription_plans SET 
  price_yearly = 349.00,
  price_half_yearly = 190.00,
  price_quarterly = 100.00,
  price_monthly = 35.00
WHERE name = 'Business';

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id SERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES schools(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  fee_term VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(20),
  transaction_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed',
  subscription_start_date DATE NOT NULL,
  subscription_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_school ON subscription_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
