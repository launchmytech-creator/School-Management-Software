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

  // [NEW] Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const data = req.body;

      const result = await authService.updateProfile(userId, data);

      return ApiResponse.success(res, result, "Profile updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      return ApiResponse.success(
        res,
        result,
        "If an account exists, a reset link has been sent",
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const result = await authService.resetPassword(token, newPassword);

      return ApiResponse.success(res, result, "Password reset successful");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
