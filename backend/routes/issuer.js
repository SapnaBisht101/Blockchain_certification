import express from "express";
import {
  certificate,
  iss_verifier as Issuer,
  certReq as Request,
} from "../mongo.js";

const router = express.Router();
// GET all certis issued by a specific issuer
router.get("/:id/certificates", async (req, res) => {
  try {
    const { id } = req.params;

    const certificates = await certificate
      .find({ issuerId: id })
      .populate({
                path: 'issuerId',
                // Select only the image fields, name, and title from the IssuerVerifier model
                select: 'institutionLogo signatureImage  issuerTitle -_id' 
            })
            .sort({ issuedAt: -1 });

            // --- Data Transformation: Flatten the output ---
        const certis = certificates.map(cert => {
            // Convert to a plain JavaScript object
            const certObj = cert.toObject();
            
            // Extract the populated issuer data
            const issuerData = certObj.issuerId || {};

            // Return the combined, flattened object
            return {
                ...certObj,
                
                // 💡 Inject the requested image data from the issuer
                logoImage: issuerData.institutionLogo, 
                signatureImage: issuerData.signatureImage,
                
                // Ensure name/title fields are consistent (optional, but good practice)
                issuerName: issuerData.issuerName || certObj.issuerName,
                issuerTitle: issuerData.issuerTitle,
                
                // Clean up the output by removing the populated issuerId object
                issuerId: undefined 
            };
        });

    res.status(200).json({
      success: true,
      count: certis.length,
      data: certis,
    });
  } catch (error) {
    console.error("Error fetching certis:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/by-email/:email", async (req, res) => {
  try {
    const issuer = await Issuer.findOne({ email: req.params.email });

    if (!issuer) {
      return res.status(404).json({ message: "Issuer not found" });
    }

    if (!issuer.isVerified || !issuer.adminApproved) {
      return res.status(403).json({ message: "Issuer not approved" });
    }

    res.json({
      id: issuer._id,
      issuerName: issuer.issuerName,
      issuerTitle: issuer.issuerTitle,
      institutionName: issuer.institutionName,
      email: issuer.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/request/pending/:issuerId", async (req, res) => {
  try {
    console.log("pending request aayi hai ");
    const requests = await Request.find({
      issuerId: req.params.issuerId,
    }).populate("studentId", "name email");
    console.log(requests);

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/request/:requestId", async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.requestId);
    res.json({ message: "Request removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
