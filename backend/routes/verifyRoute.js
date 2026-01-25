
import express from "express";
import { student, admin, iss_verifier } from "../mongo.js";

const router = express.Router();

router.post("/verify-otp", async (req, res) => {
  console.log("otp verify request come");
  
  try {
    const { email, otp, role } = req.body;
    console.log("email :",email,"otp:",otp,"role:",role);
    
    if (!email || !otp || !role) return res.status(400).json({ message: "Missing fields" });

    let Model;
    if (role === "student") Model = student;
    else if (role === "admin") Model = admin;
    else if (role === "issuer") Model = iss_verifier;
    else return res.status(400).json({ message: "Invalid role" });

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpires && Date.now() > user.otpExpires) return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
