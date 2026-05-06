const pool = require("../database/connection");
const schoolsService = require("../modules/schools/schools.service");

const runSubscriptionExpiryCheck = async () => {
  try {
    const result = await pool.query(
      `UPDATE schools 
       SET subscription_status = 'expired' 
       WHERE subscription_end_date < CURRENT_DATE 
       AND subscription_status IN ('active', 'trial')
       AND subscription_end_date IS NOT NULL
       RETURNING id, name, subscription_status, subscription_end_date`
    );
    if (result.rows.length > 0) {
      console.log(`[${new Date().toISOString()}] Expired ${result.rows.length} school subscription(s):`, 
        result.rows.map(r => r.name).join(", "));
    }
  } catch (error) {
    console.error("[subscription-expiry] Cron failed:", error.message);
  }
};

const runPendingDowngradeCheck = async () => {
  try {
    await schoolsService.applyPendingDowngrades();
  } catch (error) {
    console.error("[subscription-expiry] Downgrade check failed:", error.message);
  }
};

const startSubscriptionExpiryCron = () => {
  console.log("[subscription-expiry] Cron job started - runs daily at midnight");

  const msUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  const scheduleNext = () => {
    setTimeout(() => {
      runSubscriptionExpiryCheck();
      runPendingDowngradeCheck();
      setInterval(() => {
        runSubscriptionExpiryCheck();
        runPendingDowngradeCheck();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight());
  };

  scheduleNext();

  runSubscriptionExpiryCheck();
  runPendingDowngradeCheck();
};

module.exports = { startSubscriptionExpiryCron };
