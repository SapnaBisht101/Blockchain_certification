import express from "express";
import { admin, iss_verifier } from "../mongo.js";

const router = express.Router();

/* ============================================================
   GET ADMIN + FACULTY STATUS
   GET /admin/details/:email
============================================================ */
router.get("/details/:email", async (req, res) => {
  console.log("admin ji welcome ");
  
  try {
    const { email } = req.params;

    const adminData = await admin.findOne({ email });

    if (!adminData)
      return res.status(404).json({ msg: "Admin not found" });

    // Separate approved & pending
    const approvedFaculties = await iss_verifier.find({ adminApproved: true });
    const pendingRequests = await iss_verifier.find({ adminApproved: false });
    console.log(approvedFaculties);
    console.log(pendingRequests)
    
    res.json({
      adminId: adminData._id,
      name: adminData.name,
      instituteName: "Institute Admin Panel",
      email: adminData.email,
      approvedFaculties,
      pendingRequests,
    });

  } catch (err) {
    console.error("Admin details error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ============================================================
   VERIFY / REJECT FACULTY
   POST /admin/verify/:facultyId   { action: "approve" | "reject" }
============================================================ */
router.post("/verify/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ msg: "Invalid action" });
    }

    const faculty = await iss_verifier.findById(facultyId);
    if (!faculty)
      return res.status(404).json({ msg: "Faculty not found" });

    if (action === "approve") {
      faculty.adminApproved = true;
      await faculty.save();
      return res.json({ msg: "Faculty approved", faculty });
    }

    if (action === "reject") {
      await iss_verifier.findByIdAndDelete(facultyId);
      return res.json({ msg: "Faculty rejected & deleted" });
    }

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* ============================================================
   LOGIN
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminData = await admin.findOne({ email });

    if (!adminData)
      return res.status(404).json({ msg: "Admin not found" });

    if (adminData.password !== password)
      return res.status(401).json({ msg: "Invalid password" });

    res.json(adminData);

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
