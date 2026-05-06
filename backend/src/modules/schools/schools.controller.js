const schoolsService = require("./schools.service");
const ApiResponse = require("../../utils/response");

class SchoolsController {
  async createSchool(req, res, next) {
    try {
      const { school, admin } = req.body;

      const result = await schoolsService.createSchool(school, admin);

      return ApiResponse.created(res, result, "School created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllSchools(req, res, next) {
    try {
      const schools = await schoolsService.getAllSchools();

      return ApiResponse.success(
        res,
        schools,
        "Schools retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  // [UPDATED] Parse school ID to integer
  async getSchoolById(req, res, next) {
    try {
      const { id } = req.params;

      const school = await schoolsService.getSchoolById(parseInt(id, 10));

      return ApiResponse.success(res, school, "School retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // [UPDATED] Parse school ID to integer for plan updates
  async updateSchool(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const school = await schoolsService.updateSchool(parseInt(id, 10), updateData);

      return ApiResponse.success(res, school, "School updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // [UPDATED] Parse school ID to integer
  async getSchoolAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await schoolsService.getSchoolAdmin(parseInt(id, 10));
      return ApiResponse.success(res, admin, "School admin retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // [UPDATED] Parse school ID to integer
  async updateSchoolAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await schoolsService.updateSchoolAdmin(parseInt(id, 10), req.body);
      return ApiResponse.success(res, admin, "School admin updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Purchase subscription
  async purchaseSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const result = await schoolsService.purchaseSubscription(parseInt(id, 10), req.body);
      return ApiResponse.success(res, result, "Subscription purchased successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Get subscription payment history
  async getSubscriptionHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await schoolsService.getSchoolSubscriptionHistory(parseInt(id, 10));
      return ApiResponse.success(res, history, "Subscription history retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Get available plans with pricing
  async getAvailablePlansWithPricing(req, res, next) {
    try {
      const plans = await schoolsService.getAvailablePlansWithPricing();
      return ApiResponse.success(res, plans, "Available plans with pricing retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Calculate upgrade pricing
  async calculateUpgrade(req, res, next) {
    try {
      const { id } = req.params;
      const result = await schoolsService.calculateUpgrade(parseInt(id, 10), req.body);
      return ApiResponse.success(res, result, "Upgrade pricing calculated successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Update plan pricing
  async updatePlanPricing(req, res, next) {
    try {
      const { planId } = req.params;
      const result = await schoolsService.updatePlanPricing(parseInt(planId, 10), req.body);
      return ApiResponse.success(res, result, "Plan pricing updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolsController();
