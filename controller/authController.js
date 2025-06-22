import { validationResult } from "express-validator";
import User from "../model/User.js";
import OTP from "../model/OTP.js";
import TokenBlacklist from "../model/TokenBlacklist.js";
import { generateOTP, sendOTPEmail } from "../utils/otpService.js";
import { generateTokens, verifyToken } from "../utils/tokenService.js";
import { createResponse } from "../utils/responseHelper.js";
import dotenv from "dotenv";
dotenv.config();

class AuthController {
  // Send OTP for login/registration
  async sendOTP(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(createResponse(false, "Validation errors", errors.array()));
      }

      const { email } = req.body;

      let user = await User.findOne({ email });
      const isNewUser = !user;

      const otp = generateOTP();

      await OTP.findOneAndDelete({ email });
      const otpDoc = new OTP({
        email,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
      });
      await otpDoc.save();

      await sendOTPEmail(email, otp, isNewUser);

      res.json(
        createResponse(true, "OTP sent successfully", {
          isNewUser,
          email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), 
        })
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json(createResponse(false, "Failed to send OTP"));
    }
  }

  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(createResponse(false, "Validation errors", errors.array()));
      }

      const { firstName, lastName, email, phoneNumber, dateOfBirth, otp } =
        req.body;

      const otpDoc = await OTP.findOne({
        email,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otpDoc) {
        return res
          .status(400)
          .json(createResponse(false, "Invalid or expired OTP"));
      }

      if (otpDoc.attempts >= 3) {
        return res
          .status(400)
          .json(
            createResponse(
              false,
              "Too many OTP attempts. Please request a new OTP"
            )
          );
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json(createResponse(false, "User already exists"));
      }

      const user = new User({
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        isVerified: true,
      });

      await user.save();

      otpDoc.isUsed = true;
      await otpDoc.save();

      const { accessToken, refreshToken } = generateTokens(user._id);

      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
      });
      user.lastLogin = new Date();
      await user.save();

      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        isVerified: user.isVerified,
      };

      res.status(201).json(
        createResponse(true, "User registered successfully", {
          user: userData,
          accessToken,
          refreshToken,
          tokenExpiry: {
            accessToken: "1h",
            refreshToken: "7d",
          },
        })
      );
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json(createResponse(false, "Registration failed"));
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json(createResponse(false, "Validation errors", errors.array()));
      }

      const { email, otp } = req.body;

      const otpDoc = await OTP.findOne({
        email,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otpDoc) {
        await OTP.updateOne({ email, otp }, { $inc: { attempts: 1 } });
        return res
          .status(400)
          .json(createResponse(false, "Invalid or expired OTP"));
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(404)
          .json(
            createResponse(false, "User not found. Please register first.")
          );
      }

      otpDoc.isUsed = true;
      await otpDoc.save();

      const { accessToken, refreshToken } = generateTokens(user._id);

      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date(),
      });

      if (user.refreshTokens.length > 5) {
        const tokensToRemove = user.refreshTokens.slice(
          0,
          user.refreshTokens.length - 5
        );
        for (const tokenObj of tokensToRemove) {
          await TokenBlacklist.create({
            token: tokenObj.token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
            tokenType: "refresh",
          });
        }
        user.refreshTokens = user.refreshTokens.slice(-5);
      }

      user.lastLogin = new Date();
      await user.save();

      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
      };

      res.json(
        createResponse(true, "Login successful", {
          user: userData,
          accessToken,
          refreshToken,
          tokenExpiry: {
            accessToken: "1h",
            refreshToken: "7d",
          },
        })
      );
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json(createResponse(false, "Login failed"));
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res
          .status(400)
          .json(createResponse(false, "Refresh token is required"));
      }

      const blacklistedToken = await TokenBlacklist.findOne({
        token: refreshToken,
      });
      if (blacklistedToken) {
        return res
          .status(401)
          .json(createResponse(false, "Token is blacklisted"));
      }

      const decoded = verifyToken(refreshToken, "refresh");
      if (!decoded) {
        return res
          .status(401)
          .json(createResponse(false, "Invalid refresh token"));
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json(createResponse(false, "User not found"));
      }

      const tokenIndex = user.refreshTokens.findIndex(
        (t) => t.token === refreshToken
      );
      if (tokenIndex === -1) {
        return res
          .status(401)
          .json(createResponse(false, "Refresh token not found"));
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        user._id
      );

      await TokenBlacklist.create({
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        tokenType: "refresh",
      });

      user.refreshTokens[tokenIndex] = {
        token: newRefreshToken,
        createdAt: new Date(),
      };

      await user.save();

      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
      };

      res.json(
        createResponse(true, "Tokens refreshed successfully", {
          user: userData,
          accessToken,
          refreshToken: newRefreshToken,
          tokenExpiry: {
            accessToken: "1h",
            refreshToken: "7d",
          },
        })
      );
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json(createResponse(false, "Token refresh failed"));
    }
  }

  // Logout
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (user && refreshToken) {
        user.refreshTokens = user.refreshTokens.filter(
          (t) => t.token !== refreshToken
        );
        await user.save();

        await TokenBlacklist.create({
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          tokenType: "refresh",
        });
      }

      // Add access token to blacklist
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const accessToken = authHeader.substring(7);
        await TokenBlacklist.create({
          token: accessToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          tokenType: "access",
        });
      }

      res.json(createResponse(true, "Logged out successfully"));
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json(createResponse(false, "Logout failed"));
    }
  }

  // Logout from all devices
  async logoutAll(req, res) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (user) {
        for (const tokenObj of user.refreshTokens) {
          await TokenBlacklist.create({
            token: tokenObj.token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            tokenType: "refresh",
          });
        }
        user.refreshTokens = [];
        await user.save();
      }
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const accessToken = authHeader.substring(7);
        await TokenBlacklist.create({
          token: accessToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          tokenType: "access",
        });
      }

      res.json(
        createResponse(true, "Logged out from all devices successfully")
      );
    } catch (error) {
      console.error("Logout all error:", error);
      res
        .status(500)
        .json(createResponse(false, "Logout from all devices failed"));
    }
  }
}

export default new AuthController();
