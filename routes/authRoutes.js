import express from "express";
import { body } from "express-validator";
import authController from "../controller/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import rateLimitMiddleware from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

// Validation rules
const sendOTPValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
];

const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phoneNumber")
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Valid phone number is required"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  body("otp").isLength({ min: 5, max: 5 }).withMessage("OTP must be 5 digits"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("otp").isLength({ min: 5, max: 5 }).withMessage("OTP must be 5 digits"),
];

// Routes
router.post(
  "/send-otp",
  rateLimitMiddleware.otpLimit,
  sendOTPValidation,
  authController.sendOTP
);
router.post(
  "/register",
  rateLimitMiddleware.authLimit,
  registerValidation,
  authController.register
);
router.post(
  "/login",
  rateLimitMiddleware.authLimit,
  loginValidation,
  authController.login
);
router.post(
  "/refresh-token",
  rateLimitMiddleware.tokenLimit,
  authController.refreshToken
);
router.post("/logout", authMiddleware, authController.logout);
router.post("/logout-all", authMiddleware, authController.logoutAll);

export default router;
