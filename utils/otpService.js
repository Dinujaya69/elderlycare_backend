import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Fixed: Added return statement
export const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const sendOTPEmail = async (email, otp, isNewUser = false) => {
  try {
    const transporter = createTransporter();

    const subject = isNewUser
      ? "Complete Your Registration - OTP Code"
      : "Your Login OTP Code";
    const greeting = isNewUser ? "Welcome!" : "Welcome back!";
    const message = isNewUser
      ? "Thank you for registering with us. Please use the following OTP to complete your registration:"
      : "Please use the following OTP to log in to your account:";

    const mailOptions = {
      from: {
        name: "ElderlyCare",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">ElderlyCare</h1>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #34495e; margin: 0 0 10px 0; font-size: 24px;">${greeting}</h2>
              <p style="color: #7f8c8d; margin: 0; font-size: 16px; line-height: 1.5;">${message}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #3498db; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block; min-width: 200px;">
                ${otp}
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #e74c3c; margin: 0; font-size: 14px; font-weight: 500;">
                ⚠️ Important: This OTP will expire in 5 minutes. Do not share this code with anyone.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                If you didn't request this OTP, please ignore this email or contact our support team.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #95a5a6; margin: 0; font-size: 12px;">
              © 2025 ElderlyCare. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};
