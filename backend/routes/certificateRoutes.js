import express from "express";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto"; 
import {certReq as CertiRequest ,  certificate as Certificate, student as Student, iss_verifier as Issuer } from "../mongo.js"; 
import { contract } from "../utils/blockchain.js"; // Aapka blockchain connection
import multer from "multer";
import jsQR from "jsqr";
import { Jimp } from "jimp";

const router = express.Router();

// --- HELPER: SHA-256 Hash Generator ---
const generateCertificateHash = (data) => {
  // Normalize everything: trim spaces and convert to lowercase
  const qrId = String(data.qrCodeId || '').trim();
  const email = String(data.studentEmail || '').trim().toLowerCase();
  const course = String(data.courseName || '').trim().toLowerCase();
  const issuer = String(data.issuerName || '').trim().toLowerCase();
  console.log("printing the hashing part :",qrId,email,course,issuer);
  
  // Sabko ek standard format mein jodo
  const hashString = `${qrId}|${email}|${course}|${issuer}`;
  
  return crypto.createHash("sha256").update(hashString).digest("hex");
};

// -------------------- MULTER UPLOAD CONFIG --------------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

// -------------------- UTILITY: Compare Data Function --------------------
const compareData = (clientData, serverCert) => {
    const mismatchedFields = [];

    // Keys to compare - must match the payload structure from /generate-qr
    const comparisonKeys = [
        { clientKey: 'qrCodeId', serverKey: 'qrCodeId' },
        { clientKey: 'studentName', serverKey: 'recipientName' },
        { clientKey: 'courseName', serverKey: 'courseName' },
        { clientKey: 'issuerName', serverKey: 'issuerName' },
        { clientKey: 'institutionName', serverKey: 'institutionName' },
        // NOTE: completionDate is too complex for this simple JSON/string comparison
    ];

    if (serverCert.status === 'revoked') {
        return { status: 'Revoked', mismatchedFields: [] };
    }

    // Basic trim and lowercase comparison for robustness
    const normalize = (str) => String(str || '').trim().toLowerCase();

    for (const { clientKey, serverKey } of comparisonKeys) {
        const clientValue = normalize(clientData[clientKey]);
        const serverValue = normalize(serverCert[serverKey]);
        
        if (clientValue && clientValue !== serverValue) {
            mismatchedFields.push(clientKey);
        }
    }

    const status = mismatchedFields.length > 0 ? 'Mismatch' : 'Match';
    return { status, mismatchedFields };
};

// -------------------- VERIFY BY IMAGE (UPLOAD QR) - MODIFIED --------------------
router.post("/extract-qr", upload.single("qrImage"), async (req, res) => {
  console.log("Extract_qr API is called -------------------------");
  
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const image = await Jimp.read(req.file.buffer);

    const qr = jsQR(
      new Uint8ClampedArray(image.bitmap.data),
      image.bitmap.width,
      image.bitmap.height
    );

    if (!qr) {
      return res.status(400).json({ success: false, message: "No QR code detected" });
    }

    //  IMPORTANT: Return the full QR data string, not just the ID.
    return res.json({ success: true, qrData: qr.data }); 

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to process image" });
  }
});

// -------------------- REVOKE CERTIFICATE --------------------
router.patch("/revoke/:qrCodeId", async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const cert = await Certificate.findOneAndUpdate(
      { qrCodeId },
      { status: "revoked", revokedAt: new Date() },
      { new: true }
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    return res.json({ success: true, message: "Certificate revoked", data: cert });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to revoke certificate" });
  }
});





// -------------------- GENERATE QR & BLOCKCHAINIZE --------------------
router.post("/generate-qr", async (req, res) => {
  try {
    const {
      studentEmail,
      courseName,
      completionDate,
      issuerName,
      institutionName,
      certificateTitle,
      certificateDescription,
    } = req.body;
    console.log("issuing the certificate ");
    let remove_request = req.body.remove_request
    console.log("Delete the request ", remove_request);
    
    
    const student = await Student.findOne({ email: studentEmail });
    const issuer = await Issuer.findOne({ issuerName });

    if (!student || !issuer) {
      return res.status(400).json({ success: false, message: "Student or Issuer not found" });
    }

    const qrCodeId = uuidv4();
    
    // 1. Generate Fingerprint (Hash)
    const certificateHash = generateCertificateHash({
      qrCodeId,
      studentEmail: student.email,
      courseName,
      issuerName: issuer.issuerName
    });

    // 2. Write to Blockchain (Sepolia)
    console.log("🔗 Connecting to Blockchain...");
    const dummyIpfsCID = "N/A"; // Abhi ke liye dummy
    
    const tx = await contract.issueCertificate(
      qrCodeId, 
      certificateHash, 
      dummyIpfsCID, 
      issuer._id.toString()
    );
    
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait(); // Transaction confirm hone tak wait karega

    // 3. Prepare QR Payload
    const payload = { qrCodeId, studentEmail: student.email, courseName };
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload));

    // 4. Save to MongoDB with Blockchain Proofs
    const newCert = new Certificate({
      qrCodeId,
      studentId: student._id,
      recipientName: student.name,
      issuerId: issuer._id,
      issuerName: issuer.issuerName,
      institutionName: institutionName || issuer.institutionName,
      certificateTitle,
      courseName,
      certificateDescription,
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      // Blockchain Fields
      certificateHash: certificateHash,
      txHash: receipt.hash, // Transaction ID save kar li
      isOnChain: true
    });

    await newCert.save();

    if (remove_request) {
  console.log("🗑 Removing certificate request...");

  const deletedRequest = await CertiRequest.findByIdAndDelete(remove_request);

  if (!deletedRequest) {
    console.log("⚠️ Request not found for deletion");
  } else {
    console.log("✅ Certificate request deleted successfully");
  }
}

    return res.json({
      success: true,
      message: "Certificate secured on Blockchain!",
      certificate: newCert,
      qrCodeUrl,
      blockchainTx: receipt.hash
    });

  } catch (error) {
    console.error("❌ Blockchain/DB Error:", error);
    return res.status(500).json({ success: false, message: "Blockchain Transaction Failed", error: error.message });
  }
});

// -------------------- VERIFY BY DATA (DB + BLOCKCHAIN CHECK) --------------------
router.post("/verify-data", async (req, res) => {
    try {
        const { qrCodeId, clientData } = req.body;
        console.log(qrCodeId,clientData);
        
        // 1. Fetch from MongoDB
        const cert = await Certificate.findOne({ qrCodeId: qrCodeId?.trim() })
                                     .populate('studentId');
        if (!cert) {
            return res.status(404).json({ valid: false, message: "Certificate not found in Registry" });
        }

        // 2. Fetch from Blockchain (The Truth)
        console.log("🔍 Fetching Proof from Blockchain...");
        const onChainData = await contract.getCertificate(qrCodeId.trim());
        const blockchainHash = onChainData.certificateHash;

        if (!blockchainHash || blockchainHash === "") {
            return res.status(404).json({ valid: false, message: "No blockchain record found for this ID" });
        }

        // 3. Double Verification Logic
        // A. Compare Client Data with DB
        const dbVsClient = compareData(clientData, cert);
        console.log("dbVsClientStatus ",dbVsClient.status);
        
const studentEmail = clientData.studentEmail || cert.studentId.email;
        // B. Compare DB Data with Blockchain (Integrity Check)
console.log(cert);

// 1. Manual data se naya hash banao (Using the normalized helper above)
const currentDbHash = generateCertificateHash({
    qrCodeId: cert.qrCodeId,
    studentEmail: studentEmail, // Manual entry wala email
    courseName: cert.courseName,           // DB wala course
    issuerName: cert.issuerName            // DB wala issuer
});

// 2. Blockchain se compare karo
const isIntegrityIntact = (currentDbHash === blockchainHash);


        return res.json({
            valid: isIntegrityIntact && dbVsClient.status === 'Match',
            status: isIntegrityIntact ? dbVsClient.status : "TAMPERED",
            blockchainVerified: isIntegrityIntact,
            message: isIntegrityIntact ? "Authentic Certificate ✅" : "WARNING: Data Tampering Detected 🚨",
            data: cert,
            blockchainTx: cert.txHash
        });

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(500).json({ valid: false, message: "Server error during verification." });
    }
});

export default router;
