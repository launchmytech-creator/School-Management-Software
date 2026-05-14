const parentsService = require("./parents.service");
const ApiResponse = require("../../utils/response");

class ParentsController {
  async createParent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const parentData = req.body;

      const result = await parentsService.createParent(parentData, schoolId);

      return ApiResponse.created(res, result, "Parent created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getParents(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const parents = await parentsService.getParentsBySchool(schoolId);

      return ApiResponse.success(
        res,
        parents,
        "Parents retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getParentById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const parent = await parentsService.getParentById(id, schoolId);

      return ApiResponse.success(res, parent, "Parent retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateParent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await parentsService.updateParent(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(res, result, "Parent updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteParent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await parentsService.deleteParent(id, schoolId);

      return ApiResponse.success(res, null, "Parent deactivated successfully");
    } catch (error) {
      next(error);
    }
  }

  async linkStudent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const { studentId } = req.body;

      const result = await parentsService.linkStudentToParent(
        id,
        studentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Student linked to parent successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async unlinkStudent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;

      const result = await parentsService.unlinkStudentFromParent(
        studentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Student unlinked from parent successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildren(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      // Service-level: parents can only fetch their own record
      const parentId = req.user.role === "parent" ? req.user.id : id;

      const children = await parentsService.getParentChildren(
        parentId,
        schoolId,
      );
      console.log(children);
      return ApiResponse.success(
        res,
        children,
        "Parent's children retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParentsController();
