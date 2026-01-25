import nodemailer from "nodemailer";

// -------- Transporter Configuration --------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // 16-digit App Password
  },
});

/**
 * Sends an OTP for password reset.
 * @param {string} toEmail - Recipient email.
 * @param {string} name - Recipient name.
 * @param {string} otp - The OTP code to send.
 */
export async function sendForgotPasswordEmail(toEmail, name, otp) {
  console.log("inside forgot password email service :", toEmail, name, otp);

  try {
    await transporter.sendMail({
      from: "QR Certify <no-reply@qrcertify.com>",
      to: toEmail,
      subject: "Reset Your Password – OTP Verification",

      html: `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        padding: 40px;
        border-radius: 18px;
        max-width: 520px;
        margin: auto;
        box-shadow: 0 12px 28px rgba(0,0,0,0.12);
      ">

        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="" alt="Logo" style="
            width: 64px;
            height: 64px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          ">
        </div>

        <!-- Gradient Heading -->
        <div style="text-align: center; margin-bottom: 14px;">
          <svg width="100%" height="40">
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#000"/>
                <stop offset="100%" stop-color="#555"/>
              </linearGradient>
            </defs>
            <text x="50%" y="28" text-anchor="middle" font-size="28" font-family="inherit" fill="url(#grad2)">
              Reset Your Password
            </text>
          </svg>
        </div>

        <p style="text-align: center; color: #333; font-size: 17px; margin: 0;">
          Hi ${name},
        </p>

        <p style="text-align: center; color: #555; font-size: 15px; line-height: 1.6; margin-top: 10px;">
          You requested to reset the password for your <strong>QR Certify</strong> account.
          <br>Please use the OTP below to proceed:
        </p>

        <!-- OTP Box -->
        <div style="
          background: #f5f5f7;
          padding: 22px 40px;
          border-radius: 14px;
          margin: 32px auto;
          width: fit-content;
          box-shadow: inset 0 0 12px rgba(0,0,0,0.08);
          border: 1px solid #e2e2e2;
        ">
          <div style="
            font-size: 34px;
            letter-spacing: 4px;
            text-align: center;
            font-weight: 600;
            background: linear-gradient(90deg, #000, #555);
            background-clip: text;
            color: transparent;
          ">
            ${otp}
          </div>
        </div>

        <p style="text-align: center; color: #444; font-size: 15px; margin-top: 10px;">
          This OTP is valid for <strong>10 minutes</strong>.
        </p>

        <p style="text-align: center; color: #999; font-size: 13px; margin-top: 28px; line-height: 1.5;">
          If you did not request a password reset, you can safely ignore this email.
        </p>

      </div>
      `,
    });

    console.log(`Password reset OTP sent to ${toEmail}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${toEmail}:`, error);
    throw new Error("Failed to send password reset email.");
  }
}
