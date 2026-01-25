import express from "express";
import { admin, student, iss_verifier } from "../mongo.js";

const router = express.Router();

// ------------------- STUDENT DETAILS -------------------
router.get("/student/:email", async (req, res) => {
  console.log("student find with email id " , req.params.email);
  
  try {
    const user = await student.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- ADMIN DETAILS -------------------
router.get("/admin/:email", async (req, res) => {
  try {
    const user = await admin.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "Admin not found" });

    const approvedFaculties = await iss_verifier.find({});
    const pendingRequests = await iss_verifier.find({});

    res.status(200).json({
      instituteName: user.name,
      adminId: user._id,
      approvedFaculties,
      pendingRequests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------- ISSUER DETAILS -------------------
router.get("/issuer/:email", async (req, res) => {
  console.log("issuer request");
  try {
    const user = await iss_verifier.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "Issuer not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
