import express from "express";
import { iss_verifier, student, admin } from "../mongo.js";
import { sendForgotPasswordEmail } from "../utils/sendForgotPasswordEmail.js"; // your mail file

const router = express.Router();

/*
  Utility to find user from ANY collection
*/
async function findUserByEmail(email) {
  const issuerUser = await iss_verifier.findOne({ email });
  if (issuerUser) return { user: issuerUser, type: "issuer" };

  const studentUser = await student.findOne({ email });
  if (studentUser) return { user: studentUser, type: "student" };

  const adminUser = await admin.findOne({ email });
  if (adminUser) return { user: adminUser, type: "admin" };

  return null;
}

/*
  Utility to save user back based on type
*/
async function saveUserByType(type, user) {
  if (type === "issuer") return await user.save();
  if (type === "student") return await user.save();
  if (type === "admin") return await user.save();
}

/* ---------------------------------------------------------
      FORGOT PASSWORD – Send OTP
--------------------------------------------------------- */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    if (!email)
      return res.status(400).json({ msg: "Email is required." });

    const userData = await findUserByEmail(email);

    if (!userData)
      return res.status(404).json({ msg: "No account found with this email." });

    const { user, type } = userData;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    await saveUserByType(type, user);

    // send mail
    await sendForgotPasswordEmail(email, user.name, otp);

    res.status(200).json({ msg: "OTP sent successfully." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ msg: "Server Error." });
  }
});

/* ---------------------------------------------------------
      RESET PASSWORD – Verify OTP & Update Password
--------------------------------------------------------- */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword)
      return res.status(400).json({ msg: "All fields are required." });

    const userData = await findUserByEmail(email);

    if (!userData)
      return res.status(404).json({ msg: "Account not found." });

    const { user, type } = userData;

    if (user.otp !== otp)
      return res.status(400).json({ msg: "Invalid OTP." });


    user.password = newPassword;
    user.otp = undefined; // remove otp
    await saveUserByType(type, user);

    res.status(200).json({ msg: "Password reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ msg: "Server Error." });
  }
});

export default router;
