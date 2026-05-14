const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../constants");
const ApiResponse = require("../utils/response");
const pool = require("../database/connection");

const checkSubscription = async (req, res, next) => {
  try {
    // Guard against missing req.user
    if (!req.user) {
      return next();
    }

    if (req.user.role === ROLES.SUPER_ADMIN) return next();
    if (!req.user.schoolId) return next();

    const result = await pool.query(
      "SELECT subscription_status, subscription_end_date FROM schools WHERE id = $1",
      [req.user.schoolId]
    );

    if (result.rows.length === 0) return next();

    const { subscription_status, subscription_end_date } = result.rows[0];

    if (subscription_status === "suspended") {
      return ApiResponse.forbidden(
        res,
        ERROR_CODES.SCHOOL_SUBSCRIPTION_SUSPENDED,
        ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_SUSPENDED]
      );
    }

    if (subscription_status === "expired") {
      return ApiResponse.forbidden(
        res,
        ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED,
        ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED]
      );
    }

    if (subscription_status === "trial" && subscription_end_date) {
      const trialEnd = new Date(subscription_end_date);
      if (trialEnd < new Date()) {
        await pool.query(
          "UPDATE schools SET subscription_status = 'expired' WHERE id = $1",
          [req.user.schoolId]
        );
        return ApiResponse.forbidden(
          res,
          ERROR_CODES.SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED,
          ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED]
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkSubscription };
