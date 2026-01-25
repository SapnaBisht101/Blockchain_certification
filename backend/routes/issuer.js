import express from "express";
import { certificate } from "../mongo.js";
const router = express.Router();
// GET all certis issued by a specific issuer
router.get("/:id/certificates", async (req, res) => {
  try {
    const { id } = req.params;

    const certis = await certificate.find({ issuerId: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: certis.length,
      data: certis
    });

  } catch (error) {
    console.error("Error fetching certis:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
export default router