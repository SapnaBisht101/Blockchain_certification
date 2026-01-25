import express from "express";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto"; 
import { certificate as Certificate, student as Student, iss_verifier as Issuer } from "../mongo.js"; 
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

router.post("/generate-qr_Disable", async (req, res) => {
  console.log(req.body);

  try {
    const {
      studentName,
      studentEmail,
      courseName,
      completionDate,
      issuerName,
      institutionName,
      certificateTitle,
      certificateDescription,
    } = req.body;

    //  Find Student by Email
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      return res.status(400).json({ success: false, message: "Student not found" });
    }

    //  Find Issuer by Name
    const issuer = await Issuer.findOne({ issuerName });
    if (!issuer) {
      return res.status(400).json({ success: false, message: "Issuer not found" });
    }

    //  Generate IDs
    const qrCodeId = uuidv4();

    //  Prepare Payload for QR Code
    const payload = {
      qrCodeId,
      studentName: student.name,
      studentEmail: student.email,
      courseName,
      issuerName: issuer.issuerName,
      institutionName: institutionName || issuer.institutionName,
      issuedOn: new Date(),
    };

    //  Generate QR Code Image
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload));

    //  Create Certificate Document
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
    });

    //  Save to DB
    await newCert.save();
    
    //  Respond
    return res.json({
      success: true,
      message: "Certificate generated successfully!",
      certificate: newCert,
      qrCodeUrl,

   
    });

  } catch (error) {
    console.error("❌ Error generating certificate:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});



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
/**
 * Compares data from the QR code (clientData) with the authoritative data (serverCert).
 * @returns {object} { status: 'Match'|'Mismatch'|'Revoked', mismatchedFields: string[] }
 */
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


// -------------------- NEW: VERIFY BY QR ID & DATA (ALL METHODS LEAD HERE) --------------------
router.post("/verify-data_Disable", async (req, res) => {
    try {
        const { qrCodeId, clientData } = req.body;
        console.log("hey",qrCodeId,clientData,"hey");
        
        if (!qrCodeId?.trim()) {
            return res.status(400).json({
                valid: false,
                status: "Invalid_ID",
                message: "QR Code ID is required",
            });
        }

        const cert = await Certificate.findOne({ qrCodeId: qrCodeId.trim() });

        if (!cert) {
            return res.status(404).json({
                valid: false,
                status: "Invalid_ID",
                message: "Certificate not found. It may be fake or invalid.",
            });
        }

        //  Perform the comparison
        const { status, mismatchedFields } = compareData(clientData, cert);
        
        const responseData = {
            qrCodeId: cert.qrCodeId,
            recipientName: cert.recipientName,
            certificateTitle: cert.certificateTitle,
            courseName: cert.courseName,
            issuerName: cert.issuerName,
            institutionName: cert.institutionName,
            certificateDescription: cert.certificateDescription,
            completionDate: cert.completionDate,
            issuedAt: cert.issuedAt,
        };

        if (status === 'Revoked') {
            return res.status(410).json({ // 410 Gone for revoked
                valid: true, // Record is valid, but status is revoked
                status: 'Revoked',
                message: "This certificate has been officially revoked.",
                data: responseData, // Still send the data for context
            });
        }


        return res.json({
            valid: true,
            status: status, // 'Match' or 'Mismatch'
            message: "Verification complete.",
            data: responseData,
            details: { mismatchedFields },
        });

    } catch (error) {
        console.error("Verification Error:", error);
        return res.status(500).json({
            valid: false,
            status: "Error",
            message: "Server error during verification.",
        });
    }
});


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
