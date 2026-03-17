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

  async getSchoolById(req, res, next) {
    try {
      const { id } = req.params;

      const school = await schoolsService.getSchoolById(id);

      return ApiResponse.success(res, school, "School retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateSchool(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const school = await schoolsService.updateSchool(id, updateData);

      return ApiResponse.success(res, school, "School updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolsController();
