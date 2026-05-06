const pool = require("../database/connection");
const emailService = require("../utils/emailService");
const emailTemplates = require("../utils/emailTemplates");
const logger = require("../utils/logger");

const runSubscriptionExpiryNotifications = async () => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.subscription_end_date, s.subscription_status,
              u.id as user_id, u.email, u.full_name
       FROM schools s
       JOIN users u ON u.school_id = s.id AND u.role = 'school_admin' AND u.is_active = true
       WHERE s.subscription_end_date IS NOT NULL
         AND s.subscription_status IN ('active', 'trial')
         AND (s.subscription_end_date - CURRENT_DATE) IN (30, 7, 1)
       ORDER BY s.subscription_end_date ASC`
    );

    if (result.rows.length === 0) {
      return;
    }

    logger.info(`[subscription-expiry-notifier] Found ${result.rows.length} school(s) with upcoming expiry`);

    for (const row of result.rows) {
      const daysLeft = Math.ceil(
        (new Date(row.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      const urgencyLabel = daysLeft === 1 ? 'tomorrow' : daysLeft === 7 ? 'in 7 days' : 'in 30 days';
      const expiryDate = new Date(row.subscription_end_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const message = `Your school subscription will expire ${urgencyLabel} on ${expiryDate}. Please renew to avoid service interruption.`;
      const subject = `Subscription Expiry Warning — ${daysLeft} Day${daysLeft > 1 ? 's' : ''} Remaining`;

      const html = emailTemplates.subscriptionExpiry({
        recipientName: row.full_name,
        schoolName: row.name,
        expiryDate,
        daysLeft,
      });

      try {
        await emailService.sendMail({
          to: row.email,
          subject,
          html,
          fromName: row.name,
        });
        logger.info(`[subscription-expiry-notifier] Email sent to ${row.email} for school "${row.name}" (${daysLeft} days left)`);
      } catch (emailErr) {
        logger.error(`[subscription-expiry-notifier] Failed to email ${row.email}`, { error: emailErr.message });
      }
    }
  } catch (error) {
    logger.error("[subscription-expiry-notifier] Cron failed:", { error: error.message });
  }
};

const startSubscriptionExpiryNotifier = () => {
  logger.info("[subscription-expiry-notifier] Cron job registered — runs daily at midnight");

  const msUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  const scheduleNext = () => {
    setTimeout(() => {
      runSubscriptionExpiryNotifications();
      setInterval(runSubscriptionExpiryNotifications, 24 * 60 * 60 * 1000);
    }, msUntilMidnight());
  };

  scheduleNext();

  runSubscriptionExpiryNotifications();
};

module.exports = { startSubscriptionExpiryNotifier, runSubscriptionExpiryNotifications };
