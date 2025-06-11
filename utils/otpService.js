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

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
        name: "Your App Name",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin: 0;">ElderlyCare</h1>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">${greeting}</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${message}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #007bff; color: white; padding: 15px 30px; border-radius: 5px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
                  ${otp}
                </div>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-weight: bold;">⚠️ Important: This OTP will expire in 5 minutes. Do not share this code with anyone.</p>
              </div>
              
              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you didn't request this OTP, please ignore this email or contact our support team.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2025 Your App Name. All rights reserved.</p>
            </div>
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
