-- ============================================
-- Fix Proportional Pricing for All Plans
-- ============================================
-- Half-Yearly = Yearly / 2
-- Quarterly = Yearly / 4
-- Monthly = Yearly / 12 (rounded to nearest integer)

-- Basic Plan (Yearly = ₹10,000)
UPDATE subscription_plans SET
  price_half_yearly = 5000.00,
  price_quarterly = 2500.00,
  price_monthly = 833.00
WHERE name = 'Basic';

-- Premium Plan (Yearly = ₹15,000)
UPDATE subscription_plans SET
  price_half_yearly = 7500.00,
  price_quarterly = 3750.00,
  price_monthly = 1250.00
WHERE name = 'Premium';

-- Business Plan (Yearly = ₹20,000)
UPDATE subscription_plans SET
  price_half_yearly = 10000.00,
  price_quarterly = 5000.00,
  price_monthly = 1667.00
WHERE name = 'Business';
