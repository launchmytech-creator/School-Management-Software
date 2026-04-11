const pool = require("../../database/connection");

class SuperAdminService {
  async getStats() {
    const queries = {
      counts: `
        SELECT 
          COUNT(*) as "totalSchools",
          COUNT(*) FILTER (WHERE is_active = true) as "activeSchools",
          COUNT(*) FILTER (WHERE is_active = false) as "inactiveSchools"
        FROM schools
      `,
      plans: `
        SELECT 
          COALESCE(SUM(CASE WHEN subscription_plan_id = 1 THEN 1 ELSE 0 END), 0) as "basicPlans",
          COALESCE(SUM(CASE WHEN subscription_plan_id = 2 THEN 1 ELSE 0 END), 0) as "premiumPlans",
          COALESCE(SUM(CASE WHEN subscription_plan_id = 3 THEN 1 ELSE 0 END), 0) as "businessPlans"
        FROM schools
      `,
    };

    const [countsResult, plansResult] = await Promise.all([
      pool.query(queries.counts),
      pool.query(queries.plans),
    ]);

    const counts = countsResult.rows[0];
    const plans = plansResult.rows[0];

    return {
      totalSchools: parseInt(counts.totalSchools),
      activeSchools: parseInt(counts.activeSchools),
      inactiveSchools: parseInt(counts.inactiveSchools),
      basicPlans: parseInt(plans.basicPlans),
      premiumPlans: parseInt(plans.premiumPlans),
      businessPlans: parseInt(plans.businessPlans),
    };
  }

  async getRecentSchools() {
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.created_at as "createdAt",
        sp.name as "plan"
      FROM schools s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `;

    const result = await pool.query(query);

    return result.rows.map((school) => ({
      ...school,
      initials: school.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      logoBg: "bg-primary", // Default bg for now
    }));
  }

  async bulkDeactivate(ids) {
    const query = `
      UPDATE schools 
      SET is_active = false 
      WHERE id = ANY($1)
    `;
    await pool.query(query, [ids]);
  }
}

module.exports = new SuperAdminService();
