import User from "../model/User.js";
import { createResponse } from "../utils/responseHelper.js";
import dotenv from "dotenv";
dotenv.config();

class UserController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId).select(
        "-refreshTokens"
      );
      if (!user) {
        return res.status(404).json(createResponse(false, "User not found"));
      }

      res.json(
        createResponse(true, "Profile retrieved successfully", { user })
      );
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json(createResponse(false, "Failed to get profile"));
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phoneNumber, dateOfBirth } = req.body;
      const userId = req.user.userId;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName,
          phoneNumber,
          dateOfBirth: new Date(dateOfBirth),
        },
        { new: true, runValidators: true }
      ).select("-refreshTokens");

      if (!user) {
        return res.status(404).json(createResponse(false, "User not found"));
      }

      res.json(createResponse(true, "Profile updated successfully", { user }));
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json(createResponse(false, "Failed to update profile"));
    }
  }
}

export default new UserController();
