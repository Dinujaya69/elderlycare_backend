import rateLimit from "express-rate-limit";


const otpLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3, 
  message: {
    success: false,
    message: "Too many OTP requests. Please wait before requesting again.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth operations limiting
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token refresh limiting
const tokenLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    message: "Too many token refresh requests. Please wait.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  otpLimit,
  authLimit,
  tokenLimit,
};
