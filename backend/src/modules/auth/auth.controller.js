const authService = require("./auth.service");
const ApiResponse = require("../../utils/response");
const { ERROR_CODES, ERROR_MESSAGES } = require("../../constants");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return ApiResponse.success(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const profile = await authService.getProfile(userId);

      return ApiResponse.success(
        res,
        profile,
        "Profile retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
