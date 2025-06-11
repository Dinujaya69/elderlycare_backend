import express from "express";
import { body } from "express-validator";
import userController from "../controller/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Validation 
const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters"),
  body("phoneNumber")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Valid phone number is required"),
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth is required"),
];


router.get("/profile", authMiddleware, userController.getProfile);
router.put(
  "/profile",
  authMiddleware,
  updateProfileValidation,
  userController.updateProfile
);

export default router;
