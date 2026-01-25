import express from "express";
import { admin, student, iss_verifier } from "../mongo.js";
import crypto from "crypto";
import { sendOtpEmail } from "../utils/emailServiceModule.js";

const router = express.Router();

/* ---------------- STUDENT REGISTER ---------------- */
router.post("/student", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check duplicate
    const existing = await student.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    // Generate OTP
    const otp = crypto.randomBytes(3).toString("hex");

    // Save user with OTP
    const newStudent = new student({
      name,
      email,
      password,
      isVerified: false,
      otp,
    });

    await newStudent.save();

    // Send email
    await sendOtpEmail(email, name, otp);

    res.status(201).json({ message: "Verification OTP sent to email." });
  } catch (err) {
    console.error("Student registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});


/* ---------------- ADMIN REGISTER ---------------- */
router.post("/admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const otp = crypto.randomBytes(3).toString("hex");

    const newAdmin = new admin({
      name,
      email,
      password,
      isVerified: false,
      otp,
    });

    await newAdmin.save();

    await sendOtpEmail(email, name, otp);

    res.status(201).json({ message: "Verification OTP sent to admin email." });
  } catch (err) {
    console.error("Admin registration error:", err);
    res.status(500).json({ message: "Server error during admin registration." });
  }
});


/* ---------------- ISSUER / TEACHER REGISTER ---------------- */
router.post("/issuer", async (req, res) => {
  try {
    const { issuerName, issuerTitle, institutionName, email, password, institutionLogo, signatureImage } = req.body;

    const existing = await iss_verifier.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const otp = crypto.randomBytes(3).toString("hex");

    const newIssuer = new iss_verifier({
      issuerName,
      issuerTitle,
      institutionName,
      email,
      password,
      institutionLogo,
      signatureImage,
      adminApproved:false,
      isVerified: false,
      otp,
    });

    await newIssuer.save();

    await sendOtpEmail(email, issuerName, otp);

    res.status(201).json({ message: "Verification OTP sent to issuer email." });
  } catch (err) {
    console.error("Issuer registration error:", err);
    res.status(500).json({ message: "Server error during issuer registration.", error: err.message });
  }
});

export default router;
