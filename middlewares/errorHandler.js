import { createResponse } from "../utils/responseHelper.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res
      .status(400)
      .json(createResponse(false, "Validation error", errors));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json(createResponse(false, `${field} already exists`));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(createResponse(false, "Invalid token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(createResponse(false, "Token expired"));
  }

  // Default error
  res
    .status(err.status || 500)
    .json(createResponse(false, err.message || "Internal server error"));
};

export default errorHandler;
