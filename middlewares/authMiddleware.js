import { verifyToken } from "../utils/tokenService.js";
import TokenBlacklist from "../model/TokenBlacklist.js";
import { createResponse } from "../utils/responseHelper.js";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(createResponse(false, "Access token is required"));
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const blacklistedToken = await TokenBlacklist.findOne({ token });
    if (blacklistedToken) {
      return res
        .status(401)
        .json(createResponse(false, "Token is blacklisted"));
    }

    // Verify token
    const decoded = verifyToken(token, "access");
    if (!decoded) {
      return res
        .status(401)
        .json(createResponse(false, "Invalid or expired token"));
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json(createResponse(false, "Authentication failed"));
  }
};

export default authMiddleware;
