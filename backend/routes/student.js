import express from "express";
import { certificate as Certificate } from "../mongo.js"; 

const router = express.Router();

// Fetch full certificate details for a student, including logo and signature
router.get("/certificates/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID missing in request."
            });
        }

        // Fetch certificate data and POPULATE the issuer details
        const certificates = await Certificate.find({ studentId })
            .populate({
                path: 'issuerId',
                // Select only the image fields, name, and title from the IssuerVerifier model
                select: 'institutionLogo signatureImage issuerName issuerTitle -_id' 
            })
            .sort({ issuedAt: -1 });

        // --- Data Transformation: Flatten the output ---
        const transformedCertificates = certificates.map(cert => {
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
        // ------------------------------------------------


        return res.json({ success: true, certificates: transformedCertificates });
    } catch (error) {
        console.error("Backend error fetching certificates:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

export default router;