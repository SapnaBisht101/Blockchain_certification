  import express from "express";
  import QRCode from "qrcode";
  import { v4 as uuidv4 } from "uuid";
  import crypto from "crypto";
  import {
    certReq as CertiRequest,
    certificate as Certificate,
    student as Student,
    iss_verifier as Issuer,
  } from "../mongo.js";
  import { contract } from "../utils/blockchain.js";
  import multer from "multer";
  import jsQR from "jsqr";
  import { Jimp } from "jimp";

  const router = express.Router();

  const generateCertificateHash = (data) => {
    const qrId = String(data.qrCodeId || "").trim();
    const email = String(data.studentEmail || "")
      .trim()
      .toLowerCase();
    const course = String(data.courseName || "")
      .trim()
      .toLowerCase();
    const issuer = String(data.issuerName || "")
      .trim()
      .toLowerCase();

    const hashString = `${qrId}|${email}|${course}|${issuer}`;
    return crypto.createHash("sha256").update(hashString).digest("hex");
  };

  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) return cb(null, true);
      cb(new Error("Only image files are allowed"));
    },
  });

  const normalizeValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const cleanOCR = (text) =>
    String(text || "")
      .replace(/\r?\n/g, " ")
      .replace(/¢/g, "c")
      .replace(/!/g, "1")
      .replace(/\b1D\b/g, "ID")
      .replace(/\b0F\b/gi, "OF")
      .replace(/\bT0\b/gi, "TO")
      .replace(/\bPR0UDLY\b/gi, "PROUDLY")
      .replace(/\bC0MPLETION\b/gi, "COMPLETION")
      .replace(/\[\d+\]/g, "")
      .replace(/[|—]/g, " ")
      .replace(/\s*:\s*/g, ": ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeTextBlock = (value) =>
    normalizeValue(value)
      .replace(/[^a-z0-9@\s./:-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const toNormalizedSearchToken = (value) => normalizeTextBlock(value);
  const toCompactIdentifier = (value) => normalizeValue(value).replace(/[^a-z0-9]/g, "");
  const toWordTokens = (value) => toNormalizedSearchToken(value).split(" ").filter(Boolean);

  const buildDateSearchTokens = (value) => {
    const normalizedRawValue = toNormalizedSearchToken(value);
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return normalizedRawValue ? [normalizedRawValue] : [];
    }

    const utcYear = parsedDate.getUTCFullYear();
    const utcMonth = parsedDate.getUTCMonth();
    const utcDay = parsedDate.getUTCDate();
    const utcDate = new Date(Date.UTC(utcYear, utcMonth, utcDay));

    return [
      normalizedRawValue,
      toNormalizedSearchToken(utcDate.toISOString().slice(0, 10)),
      toNormalizedSearchToken(
        utcDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })
      ),
      toNormalizedSearchToken(
        utcDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          timeZone: "UTC",
        })
      ),
    ].filter(Boolean);
  };

  const buildExpectedOcrSegments = (qrPayload = {}) =>
    [
      { key: "qrCodeId", label: "Certificate ID", value: qrPayload.qrCodeId, type: "id" },
      { key: "studentName", label: "Student Name", value: qrPayload.studentName, type: "text" },
      { key: "issuerName", label: "Issuer Name", value: qrPayload.issuerName, type: "text" },
      { key: "certificateTitle", label: "Certificate Title", value: qrPayload.certificateTitle, type: "text" },
      { key: "completionDate", label: "Date Of Issuance", value: qrPayload.completionDate, type: "date" },
    ].filter((segment) => segment.value);

  const matchOcrSegment = (segment, normalizedOcrText) => {
    const ocrWordSet = new Set(toWordTokens(normalizedOcrText));
    const compactOcrText = toCompactIdentifier(normalizedOcrText);

    if (segment.type === "id") {
      const compactExpectedId = toCompactIdentifier(segment.value);
      return {
        matched: Boolean(compactExpectedId) && compactOcrText.includes(compactExpectedId),
        strategy: "compact_id",
        expected: compactExpectedId,
      };
    }

    if (segment.type === "date") {
      const dateCandidates = buildDateSearchTokens(segment.value);
      const exactDateMatch = dateCandidates.find((candidate) => normalizedOcrText.includes(candidate));

      if (exactDateMatch) {
        return { matched: true, strategy: "date_candidate", expected: exactDateMatch };
      }

      const dateTokens = dateCandidates
        .flatMap((candidate) => candidate.split(" "))
        .filter((token) => token.length > 1);
      const uniqueDateTokens = [...new Set(dateTokens)];
      const matchedDateTokens = uniqueDateTokens.filter((token) => ocrWordSet.has(token));

      return {
        matched: uniqueDateTokens.length > 0 && matchedDateTokens.length >= Math.min(3, uniqueDateTokens.length),
        strategy: "date_tokens",
        expected: dateCandidates,
        matchedTokens: matchedDateTokens,
      };
    }

    const normalizedValue = toNormalizedSearchToken(segment.value);
    if (normalizedValue && normalizedOcrText.includes(normalizedValue)) {
      return { matched: true, strategy: "exact_text", expected: normalizedValue };
    }

    const expectedTokens = toWordTokens(segment.value).filter((token) => token.length > 1);
    const matchedTokens = expectedTokens.filter((token) => ocrWordSet.has(token));

    return {
      matched: expectedTokens.length > 0 && matchedTokens.length === expectedTokens.length,
      strategy: "word_tokens",
      expected: expectedTokens,
      matchedTokens,
    };
  };
  const formatStep = (name, passed, details = {}, message = "") => ({
    name,
    label:
      name === "ocr_verified"
        ? "OCR Verified"
        : name === "db_verified"
          ? "DB Verified"
          : name === "blockchain_verified"
            ? "Blockchain Verified"
            : name,
    passed,
    message,
    details,
  });

  const parseQrPayload = (rawInput) => {
    if (!rawInput || typeof rawInput !== "string") {
      return { qrCodeId: "", payload: null, rawInput: "" };
    }

    const trimmed = rawInput.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return {
        qrCodeId: String(parsed?.qrCodeId || "").trim(),
        payload: parsed,
        rawInput: trimmed,
      };
    } catch {
      return {
        qrCodeId: trimmed,
        payload: { qrCodeId: trimmed },
        rawInput: trimmed,
      };
    }
  };

  const buildCertificatePayload = (cert) => ({
    qrCodeId: cert.qrCodeId,
    studentName: cert.recipientName,
    studentEmail: cert.studentId?.email || "",
    courseName: cert.courseName,
    issuerName: cert.issuerName,
    institutionName: cert.institutionName,
    completionDate: cert.completionDate,
    certificateTitle: cert.certificateTitle,
  });

  const serializeCertificate = (cert) => {
    const plain = cert.toObject ? cert.toObject() : cert;
    return {
      ...plain,
      studentEmail: plain.studentId?.email || "",
    };
  };

  const fetchCertificateByQrId = async (qrCodeId) => {
    if (!qrCodeId?.trim()) return null;
    return Certificate.findOne({ qrCodeId: qrCodeId.trim() }).populate("studentId");
  };

  const fetchCertificateByHash = async (certificateHash) => {
    if (!certificateHash?.trim()) return null;
    return Certificate.findOne({
      certificateHash: certificateHash.trim().toLowerCase(),
    }).populate("studentId");
  };

  const verifyAgainstDatabase = (cert, qrPayload = {}) => {
    const expectedPayload = buildCertificatePayload(cert);
    const comparedFields = [
      ["qrCodeId", "Certificate ID"],
      ["studentName", "Student Name"],
      ["issuerName", "Issuer Name"],
      ["certificateTitle", "Certificate Title"],
      ["completionDate", "Date Of Issuance"],
    ];

    if (cert.status === "revoked") {
      return formatStep(
        "db_verified",
        false,
        { mismatches: ["status"], expectedPayload },
        "Certificate is revoked in the database registry."
      );
    }

    const mismatches = comparedFields
      .filter(([key]) => {
        const qrValue = normalizeValue(qrPayload[key]);
        if (!qrValue) return false;
        if (key === "completionDate") {
          const qrTokens = buildDateSearchTokens(qrPayload[key]);
          const expectedTokens = buildDateSearchTokens(expectedPayload[key]);
          return !qrTokens.some((token) => expectedTokens.includes(token));
        }
        return qrValue !== normalizeValue(expectedPayload[key]);
      })
      .map(([, label]) => label);

    return formatStep(
      "db_verified",
      mismatches.length === 0,
      {
        comparedFields: comparedFields.map(([, label]) => label),
        mismatches,
        expectedPayload,
      },
      mismatches.length === 0
        ? "Certificate data matches the database record."
        : "Certificate data does not match the database record."
    );
  };

  const verifyAgainstBlockchain = async (cert) => {
    const onChainData = await contract.getCertificate(cert.qrCodeId.trim());
    const blockchainHash = onChainData?.certificateHash || "";

    if (!blockchainHash) {
      return formatStep(
        "blockchain_verified",
        false,
        {
          blockchainHash: null,
          databaseHash: cert.certificateHash || null,
          transactionHash: cert.txHash || null,
        },
        "No blockchain record found for this certificate."
      );
    }

    const currentDbHash = generateCertificateHash({
      qrCodeId: cert.qrCodeId,
      studentEmail: cert.studentId?.email,
      courseName: cert.courseName,
      issuerName: cert.issuerName,
    });

    const passed = currentDbHash === blockchainHash;
    return formatStep(
      "blockchain_verified",
      passed,
      {
        blockchainHash,
        databaseHash: currentDbHash,
        storedHash: cert.certificateHash || null,
        transactionHash: cert.txHash || null,
      },
      passed
        ? "Blockchain hash matches the certificate record."
        : "Blockchain hash does not match the certificate record."
    );
  };

  const verifyOcrVsQr = (rawOcrText = "", qrPayload = {}) => {
    const cleanedText = cleanOCR(rawOcrText);
    const normalizedOcrText = normalizeTextBlock(cleanedText);
    const expectedSegments = buildExpectedOcrSegments(qrPayload);
    const segmentResults = expectedSegments.map((segment) => ({
      ...segment,
      match: matchOcrSegment(segment, normalizedOcrText),
    }));
    const missingSegments = segmentResults
      .filter((segment) => !segment.match.matched)
      .map((segment) => segment.label);
    const passed = missingSegments.length === 0;

    return formatStep(
      "ocr_verified",
      passed,
      {
        expectedSegments: segmentResults.map(({ key, label, value, type, match }) => ({
          key,
          label,
          value,
          type,
          match,
        })),
        missingSegments,
        rawOcrText: cleanedText,
        ignoredVisualElements: ["signatureImage", "institutionLogo"],
      },
      passed
        ? "All required certificate fields were matched between QR and OCR."
        : "One or more required certificate fields could not be matched in OCR."
    );
  };

  const sendVerificationResponse = (res, { cert = null, steps = [], fallbackStatus }) => {
    const valid = steps.every((step) => step.passed);
    const failedStep = steps.find((step) => !step.passed);

    return res.json({
      valid,
      status: valid ? "VERIFIED" : fallbackStatus || "INVALID",
      message: valid
        ? "Certificate verification successful."
        : failedStep?.message || "Certificate verification failed.",
      steps,
      data: cert ? serializeCertificate(cert) : null,
    });
  };

  router.post("/extract-qr", upload.single("qrImage"), async (req, res) => {
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

      return res.json({ success: true, qrData: qr.data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to process image" });
    }
  });

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

      return res.json({
        success: true,
        message: "Certificate revoked",
        data: cert,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to revoke certificate" });
    }
  });

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

      const removeRequest = req.body.remove_request;
      const student = await Student.findOne({ email: studentEmail });
      const issuer = await Issuer.findOne({ issuerName });

      if (!student || !issuer) {
        return res.status(400).json({ success: false, message: "Student or Issuer not found" });
      }

      const qrCodeId = uuidv4();
      const normalizedCompletionDate = completionDate ? new Date(completionDate) : new Date();

      const certificateHash = generateCertificateHash({
        qrCodeId,
        studentEmail: student.email,
        courseName,
        issuerName: issuer.issuerName,
      });

      const tx = await contract.issueCertificate(qrCodeId, certificateHash, "N/A", issuer._id.toString());
      const receipt = await tx.wait();

      const payload = {
        qrCodeId,
        studentName: student.name,
        studentEmail: student.email,
        courseName,
        issuerName: issuer.issuerName,
        institutionName: institutionName || issuer.institutionName,
        completionDate: normalizedCompletionDate.toISOString(),
        certificateTitle,
      };
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(payload));

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
        qrImage: qrCodeUrl,
        completionDate: normalizedCompletionDate,
        certificateHash,
        txHash: receipt.hash,
        isOnChain: true,
        status: "active",
      });

      await newCert.save();

      if (removeRequest) {
        await CertiRequest.findByIdAndDelete(removeRequest);
      }

      return res.json({
        success: true,
        message: "Certificate secured on blockchain.",
        certificate: newCert,
        qrCodeUrl,
        blockchainTx: receipt.hash,
      });
    } catch (error) {
      console.error("Blockchain/DB Error:", error);
      return res.status(500).json({
        success: false,
        message: "Blockchain transaction failed",
        error: error.message,
      });
    }
  });

  router.post("/verify-manual", async (req, res) => {
    try {
      const { manualInput } = req.body;
      const parsed = parseQrPayload(manualInput);
      let cert = await fetchCertificateByQrId(parsed.qrCodeId);

      if (!cert && /^[a-f0-9]{64}$/i.test(parsed.rawInput || "")) {
        cert = await fetchCertificateByHash(parsed.rawInput);
      }

      if (!cert) {
        return res.status(404).json({
          valid: false,
          message: "Certificate not found for the provided manual input.",
        });
      }

      const blockchainStep = await verifyAgainstBlockchain(cert);
      return sendVerificationResponse(res, {
        cert,
        steps: [blockchainStep],
        fallbackStatus: "BLOCKCHAIN_FAILED",
      });
    } catch (error) {
      console.error("Manual verification error:", error);
      return res.status(500).json({
        valid: false,
        message: "Server error during manual verification.",
      });
    }
  });

  router.post("/verify-qr", async (req, res) => {
    try {
      const { qrData } = req.body;
      const parsed = parseQrPayload(qrData);

      if (!parsed.qrCodeId) {
        return res.status(400).json({
          valid: false,
          message: "QR Code ID is missing in the scanned payload.",
        });
      }

      const cert = await fetchCertificateByQrId(parsed.qrCodeId);
      if (!cert) {
        return res.status(404).json({ valid: false, message: "Certificate not found in registry." });
      }

      const dbStep = verifyAgainstDatabase(cert, parsed.payload);
      const blockchainStep = await verifyAgainstBlockchain(cert);

      return sendVerificationResponse(res, {
        cert,
        steps: [dbStep, blockchainStep],
        fallbackStatus: "QR_VERIFICATION_FAILED",
      });
    } catch (error) {
      console.error("QR verification error:", error);
      return res.status(500).json({
        valid: false,
        message: "Server error during QR verification.",
      });
    }
  });

  router.post("/verify-certificate", async (req, res) => {
    try {
      const { qrData, rawText } = req.body;
      const parsed = parseQrPayload(qrData);
      console.log("[VERIFY][CERTIFICATE][OCR_RAW_TEXT]", cleanOCR(rawText || ""));

      if (!parsed.qrCodeId) {
        return res.status(400).json({
          valid: false,
          message: "QR Code ID is missing in the certificate payload.",
        });
      }

      const cert = await fetchCertificateByQrId(parsed.qrCodeId);
      if (!cert) {
        return res.status(404).json({ valid: false, message: "Certificate not found in registry." });
      }

      const ocrStep = verifyOcrVsQr(rawText, parsed.payload);
      const dbStep = verifyAgainstDatabase(cert, parsed.payload);
      const blockchainStep = await verifyAgainstBlockchain(cert);

      return sendVerificationResponse(res, {
        cert,
        steps: [ocrStep, dbStep, blockchainStep],
        fallbackStatus: "CERTIFICATE_VERIFICATION_FAILED",
      });
    } catch (error) {
      console.error("Certificate verification error:", error);
      return res.status(500).json({
        valid: false,
        message: "Server error during certificate verification.",
      });
    }
  });

  router.post("/verify-data", async (req, res) => {
    try {
      const qrData =
        req.body.clientData && Object.keys(req.body.clientData).length > 0
          ? JSON.stringify(req.body.clientData)
          : req.body.qrCodeId;

      const parsed = parseQrPayload(qrData);
      if (!parsed.qrCodeId) {
        return res.status(400).json({
          valid: false,
          message: "QR Code ID is missing in the provided data.",
        });
      }

      const cert = await fetchCertificateByQrId(parsed.qrCodeId);
      if (!cert) {
        return res.status(404).json({ valid: false, message: "Certificate not found in registry." });
      }

      const dbStep = verifyAgainstDatabase(cert, parsed.payload);
      const blockchainStep = await verifyAgainstBlockchain(cert);

      return sendVerificationResponse(res, {
        cert,
        steps: [dbStep, blockchainStep],
        fallbackStatus: "QR_VERIFICATION_FAILED",
      });
    } catch (error) {
      console.error("Legacy verification error:", error);
      return res.status(500).json({
        valid: false,
        message: "Server error during verification.",
      });
    }
  });

  export default router;
