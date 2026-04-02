import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  Camera,
  Upload,
  FileText,
  User,
  BookOpen,
  Calendar,
  Building,
  ScanLine,
  ArrowLeft,
  XCircle,
  Printer,
  RefreshCcw,
  Shield,
  Info,
  Hash,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import jsQR from "jsqr";
import { useMessage } from "../GlobalMessageProvider";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const API_BASE = "http://localhost:4000/certificates";

const STEP_LABELS = {
  ocr_verified: "OCR Verified",
  db_verified: "DB Verified",
  blockchain_verified: "Blockchain Verified",
};

const STATUS_LABELS = {
  VERIFIED: "Verified",
  BLOCKCHAIN_FAILED: "Blockchain Check Failed",
  QR_VERIFICATION_FAILED: "QR Verification Failed",
  CERTIFICATE_VERIFICATION_FAILED: "Certificate Verification Failed",
  ERROR: "Error",
  INVALID: "Invalid",
};

// OCR output is noisy, so normalize common scan mistakes before comparing it to QR data.
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
      }),
    ),
    toNormalizedSearchToken(
      utcDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
      }),
    ),
  ].filter(Boolean);
};

// QR uploads may contain either the raw ID or the full JSON payload.
const parseQrPayload = (rawData) => {
  if (!rawData || typeof rawData !== "string") {
    return { qrCodeId: "", payload: null };
  }

  try {
    const parsed = JSON.parse(rawData);
    return {
      qrCodeId: String(parsed?.qrCodeId || "").trim(),
      payload: parsed,
    };
  } catch {
    const trimmed = rawData.trim();
    return {
      qrCodeId: trimmed,
      payload: { qrCodeId: trimmed },
    };
  }
};

// Only compare the visible fields that should appear on the certificate itself.
const buildExpectedOcrSegments = (qrPayload = {}) =>
  [
    { key: "qrCodeId", label: "Certificate ID", value: qrPayload.qrCodeId },
    { key: "studentName", label: "Student Name", value: qrPayload.studentName },
    { key: "issuerName", label: "Issuer Name", value: qrPayload.issuerName },
    { key: "completionDate", label: "Completion Date", value: qrPayload.completionDate },
    { key: "courseName", label: "Course Name", value: qrPayload.courseName },
  ]
    .map((segment) => ({
      ...segment,
      searchTokens:
        segment.key === "completionDate"
          ? buildDateSearchTokens(segment.value)
          : [toNormalizedSearchToken(segment.value)].filter(Boolean),
    }))
    .filter((segment) => segment.searchTokens.length > 0);

// PDF verification works by rendering each page to an image and reusing that image for both QR scanning and OCR.
const renderPdfPageToCanvas = async (page, scale = 2.5) => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("PDF rendering is unavailable in this browser.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;

  return { canvas, context };
};

export default function UnifiedVerify() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  // Shared verification state drives the progress panel and result card across all modes.
  const [mode, setMode] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Authenticating...");
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [scanProgress, setScanProgress] = useState("");
  const [pdfInfo, setPdfInfo] = useState(null);
  const videoRef = useRef(null);
  const manualInputRef = useRef(null);

  const resetVerificationState = useCallback(() => {
    setCertificate(null);
    setError("");
    setVerificationStatus(null);
    setVerificationDetails(null);
    setVerificationSteps([]);
  }, []);

  // A simple black-and-white fallback makes low-contrast QR codes easier to decode.
  const preprocessImage = useCallback((imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const value = gray > 128 ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }
    return { data, width: imageData.width, height: imageData.height };
  }, []);

  const decodeQrFromImageData = useCallback(
    (imageData) => {
      const attempts = [imageData, preprocessImage(imageData)];
      const inversionModes = ["dontInvert", "attemptBoth", "invertFirst"];
      for (const candidate of attempts) {
        for (const inversionMode of inversionModes) {
          const code = jsQR(candidate.data, candidate.width, candidate.height, {
            inversionAttempts: inversionMode,
          });
          if (code?.data) return code.data;
        }
      }
      return null;
    },
    [preprocessImage],
  );

  const applyVerificationResult = useCallback(
    (data, successMessage) => {
      setError("");
      setVerificationSteps(data.steps || []);
      setVerificationDetails(data);
      setVerificationStatus(data.status || (data.valid ? "VERIFIED" : "INVALID"));
      if (data.valid && data.data) {
        setCertificate(data.data);
        showMessage(successMessage, "success");
        return;
      }
      setCertificate(data.data || null);
      setError(data.message || "Verification failed.");
      showMessage(data.message || "Verification failed.", "error");
    },
    [showMessage],
  );

  const mergeVerificationResult = useCallback(
    (initialSteps, data, successMessage) => {
      const mergedSteps = [...initialSteps, ...(data.steps || [])];
      setError("");
      setVerificationSteps(mergedSteps);
      setVerificationDetails({ ...data, steps: mergedSteps });
      setVerificationStatus(data.status || (data.valid ? "VERIFIED" : "INVALID"));

      if (data.valid && data.data) {
        setCertificate(data.data);
        showMessage(successMessage, "success");
        return;
      }

      setCertificate(data.data || null);
      setError(data.message || "Verification failed.");
      showMessage(data.message || "Verification failed.", "error");
    },
    [showMessage],
  );

  const postVerification = useCallback(
    async (path, body, successMessage) => {
      setLoading(true);
      resetVerificationState();
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid server response.");
        }

        if (!res.ok && !data?.message) {
          throw new Error(`Verification request failed with status ${res.status}.`);
        }

        applyVerificationResult(data, successMessage);
      } catch (err) {
        setError(err.message || "Network error. Connection to verification server failed.");
        setVerificationStatus("ERROR");
        showMessage(err.message || "Network or server error. Could not verify.", "error");
      } finally {
        setLoading(false);
        setScanProgress("");
      }
    },
    [applyVerificationResult, resetVerificationState, showMessage],
  );

  const postVerificationWithSteps = useCallback(
    async (path, body, initialSteps, successMessage) => {
      setLoading(true);
      resetVerificationState();
      setVerificationSteps(initialSteps);
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid server response.");
        }

        if (!res.ok && !data?.message) {
          throw new Error(`Verification request failed with status ${res.status}.`);
        }

        mergeVerificationResult(initialSteps, data, successMessage);
      } catch (err) {
        setError(err.message || "Network error. Connection to verification server failed.");
        setVerificationStatus("ERROR");
        setVerificationDetails({ steps: initialSteps });
        showMessage(err.message || "Network or server error. Could not verify.", "error");
      } finally {
        setLoading(false);
        setScanProgress("");
      }
    },
    [mergeVerificationResult, resetVerificationState, showMessage],
  );

  const verifyManual = useCallback(
    async (manualInput) => {
      if (!manualInput?.trim()) {
        setError("Enter a QR ID, QR payload, or certificate hash.");
        showMessage("Manual input is required.", "error");
        return;
      }
      setLoadingLabel("Running direct blockchain verification...");
      await postVerification("/verify-manual", { manualInput }, "Blockchain verification successful.");
    },
    [postVerification, showMessage],
  );

  const verifyQrOnly = useCallback(
    async (qrData) => {
      const parsed = parseQrPayload(qrData);
      if (!parsed.qrCodeId) {
        setError("QR Code ID is missing or unreadable.");
        showMessage("Invalid or unreadable QR code.", "error");
        return;
      }
      setLoadingLabel("Running database and blockchain checks...");
      await postVerification("/verify-qr", { qrData }, "QR verification successful.");
    },
    [postVerification, showMessage],
  );

  const verifyOcrLocally = useCallback((qrData, rawText) => {
    const parsed = parseQrPayload(qrData);
    const qrPayload = parsed.payload || {};
    const cleanedText = cleanOCR(rawText);
    const normalizedOcrText = normalizeTextBlock(cleanedText);
    const expectedSegments = buildExpectedOcrSegments(qrPayload);
    const missingSegments = expectedSegments
      .filter((segment) => !segment.searchTokens.some((token) => normalizedOcrText.includes(token)))
      .map((segment) => segment.label);

    return {
      name: "ocr_verified",
      label: "OCR Verified",
      passed: missingSegments.length === 0,
      message:
        missingSegments.length === 0
          ? "All QR text values were found in the OCR text."
          : "One or more QR text values were not found in the OCR text.",
      details: {
        expectedSegments: expectedSegments.map(({ key, label, value, searchTokens }) => ({
          key,
          label,
          value,
          searchTokens,
        })),
        missingSegments,
        rawOcrText: cleanedText,
        ignoredVisualElements: ["signatureImage", "institutionLogo"],
      },
    };
  }, []);

  const verifyCompleteCertificate = useCallback(
    async ({ qrData, rawText }) => {
      const parsed = parseQrPayload(qrData);
      if (!parsed.qrCodeId) {
        setError("Certificate QR is missing or unreadable.");
        showMessage("Certificate QR is missing or unreadable.", "error");
        return;
      }

      const ocrStep = verifyOcrLocally(qrData, rawText);
      if (!ocrStep.passed) {
        resetVerificationState();
        setVerificationSteps([ocrStep]);
        setVerificationDetails({ steps: [ocrStep] });
        setVerificationStatus("CERTIFICATE_VERIFICATION_FAILED");
        setError(ocrStep.message);
        showMessage(ocrStep.message, "error");
        return;
      }

      setLoadingLabel("Running database and blockchain checks...");
      await postVerificationWithSteps(
        "/verify-qr",
        { qrData },
        [ocrStep],
        "Certificate verification successful.",
      );
    },
    [postVerificationWithSteps, resetVerificationState, showMessage, verifyOcrLocally],
  );

  // Tesseract accepts both uploaded files and canvases rendered from PDF pages.
  const runImageOcr = useCallback(async (source, progressLabel = "image") => {
    const { default: Tesseract } = await import("tesseract.js");
    const result = await Tesseract.recognize(source, "eng", {
      logger: ({ status }) => {
        if (status) setScanProgress(`OCR (${progressLabel}): ${status}`);
      },
    });

    const extractedText = result.data?.text || "";
    return extractedText;
  }, []);

  const processQrImage = useCallback(
    async (file) => {
      if (!file?.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        showMessage("Please upload a valid image file.", "error");
        return;
      }

      setLoading(true);
      setLoadingLabel("Reading QR image...");
      resetVerificationState();

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Image processing is unavailable in this browser.");
          setLoading(false);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrData = decodeQrFromImageData(imageData);
        console.log("[QR][qrImage]", qrData || "No QR detected");

        URL.revokeObjectURL(objectUrl);
        setLoading(false);

        if (!qrData) {
          setError("No valid QR code found in image.");
          showMessage("No QR code detected in the image.", "error");
          return;
        }

        await verifyQrOnly(qrData);
      };

      img.onerror = () => {
        setError("Image load failed.");
        showMessage("Failed to load image.", "error");
        setLoading(false);
        URL.revokeObjectURL(objectUrl);
      };
    },
    [decodeQrFromImageData, resetVerificationState, showMessage, verifyQrOnly],
  );

  const processCertificateImage = useCallback(
    async (file) => {
      if (!file?.type.startsWith("image/")) {
        setError("Please upload a valid image file.");
        showMessage("Please upload a valid image file.", "error");
        return;
      }

      setLoading(true);
      setLoadingLabel("Extracting QR and OCR text from certificate image...");
      resetVerificationState();

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Image processing is unavailable in this browser.");

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrData = decodeQrFromImageData(imageData);
          console.log("[QR][certificateImage]", qrData || "No QR detected");

          if (!qrData) throw new Error("No QR code detected in the certificate image.");

          // For uploaded images, OCR runs directly on the original file.
          const ocrText = await runImageOcr(file, "certificateImage");
          URL.revokeObjectURL(objectUrl);
          setLoading(false);
          await verifyCompleteCertificate({ qrData, rawText: ocrText });
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          setLoading(false);
          setError(err.message || "Failed to process certificate image.");
          showMessage(err.message || "Failed to process certificate image.", "error");
        }
      };

      img.onerror = () => {
        setError("Image load failed.");
        showMessage("Failed to load image.", "error");
        setLoading(false);
        URL.revokeObjectURL(objectUrl);
      };
    },
    [decodeQrFromImageData, resetVerificationState, runImageOcr, showMessage, verifyCompleteCertificate],
  );

  const processCertificatePdf = useCallback(
    async (file) => {
      if (file?.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        showMessage("Please upload a valid PDF file.", "error");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("PDF file is too large. Maximum size is 10MB.");
        showMessage("PDF file is too large.", "error");
        return;
      }

      setLoading(true);
      setLoadingLabel("Extracting QR and text from PDF certificate...");
      resetVerificationState();
      setPdfInfo(null);
      setScanProgress("");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfInfo({
          name: file.name,
          pages: pdf.numPages,
          size: `${(file.size / 1024).toFixed(2)} KB`,
        });

        const ocrChunks = [];
        let qrData = null;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          setScanProgress(`Rendering page ${pageNum} of ${pdf.numPages}...`);
          const page = await pdf.getPage(pageNum);
          const { canvas, context } = await renderPdfPageToCanvas(page);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          // Stop scanning for QR once one valid payload has been recovered, but keep OCRing remaining pages.
          if (!qrData) {
            setScanProgress(`Scanning page ${pageNum} of ${pdf.numPages} for QR...`);
            qrData = decodeQrFromImageData(imageData);
          }

          // OCR each rendered page image because many generated/scanned PDFs do not contain a text layer.
          setScanProgress(`Running OCR on page ${pageNum} of ${pdf.numPages}...`);
          const pageText = await runImageOcr(canvas, `PDF page ${pageNum}`);
          if (pageText.trim()) {
            ocrChunks.push(pageText);
          }
        }

        if (!qrData) throw new Error("No QR code detected in the PDF certificate.");
        const extractedText = ocrChunks.join(" ").trim();
        console.log("[QR][certificatePdf][final]", qrData);
        console.log("[OCR][certificatePdf][final]", extractedText);
        if (!extractedText) {
          throw new Error("No OCR text could be extracted from the PDF certificate.");
        }

        setLoading(false);
        await verifyCompleteCertificate({ qrData, rawText: extractedText });
      } catch (err) {
        setLoading(false);
        setError(err.message || "Failed to process the PDF document.");
        showMessage(err.message || "Failed to process the PDF document.", "error");
      } finally {
        setScanProgress("");
      }
    },
    [decodeQrFromImageData, resetVerificationState, runImageOcr, showMessage, verifyCompleteCertificate],
  );

  useEffect(() => {
    if (mode !== "qrLive") return;
    const reader = new BrowserMultiFormatReader();
    let controls = null;
    reader
      .decodeFromVideoDevice(null, videoRef.current, async (result) => {
        if (result) {
          controls?.stop();
          setMode("idle");
          await verifyQrOnly(result.getText());
        }
      })
      .catch(() => {
        setError("Camera access denied or unavailable.");
        showMessage("Camera unavailable or permission denied.", "error");
        setMode("idle");
      })
      .then((c) => {
        controls = c;
      });
    return () => controls?.stop();
  }, [mode, showMessage, verifyQrOnly]);

  const groupedModes = [
    {
      label: "Manual",
      items: [{ icon: ScanLine, title: "Manual QR", activeMode: "manual", short: "Blockchain only" }],
    },
    {
      label: "QR Only",
      items: [
        { icon: Camera, title: "Live QR Scan", activeMode: "qrLive", short: "QR -> DB -> chain" },
        { icon: Upload, title: "QR Image", activeMode: "qrImage", short: "QR image" },
      ],
    },
    {
      label: "Complete Certificate",
      items: [
        { icon: Upload, title: "Certificate Image", activeMode: "certificateImage", short: "Image OCR" },
        { icon: FileText, title: "Certificate PDF", activeMode: "certificatePdf", short: "PDF OCR" },
      ],
    },
  ];

  const SidebarItem = ({ icon: Icon, title, activeMode, short }) => (
    <button
      onClick={() => {
        setMode(activeMode);
        resetVerificationState();
        setScanProgress("");
        setPdfInfo(null);
      }}
      className={`group w-full rounded-2xl border px-4 py-3 text-left transition-colors duration-200 ${
        mode === activeMode
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
            mode === activeMode
              ? "border-blue-200 bg-white text-blue-600"
              : "border-gray-200 bg-gray-50 text-gray-500 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600"
          }`}
        >
          <Icon size={18} strokeWidth={mode === activeMode ? 2.4 : 2} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">{title}</p>
          <p className="text-xs text-gray-400 group-hover:text-blue-500">{short}</p>
        </div>
      </div>
    </button>
  );

  const statusTone = error
    ? "border-red-200 bg-red-50 text-red-600"
    : "border-emerald-200 bg-emerald-50 text-emerald-600";

  return (
    <div
      className="min-h-screen w-full bg-white text-gray-900"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <aside className="fixed left-0 top-0 z-20 flex h-full w-72 flex-col border-r border-gray-200 bg-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg">
              <img src="/pnglogo.png" alt="DECIVE" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-blue-600">DECIVE</span>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {groupedModes.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <SidebarItem key={item.activeMode} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              <Shield size={14} />
              Security Active
            </div>
            <p className="text-sm leading-6 text-gray-600">
              Every verification path returns explicit step status so you can see where tampering happened.
            </p>
          </div>
        </div>
      </aside>

      <div className="ml-72 min-h-screen">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Verification Workspace
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-blue-600">
                Unified Verify
              </h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </header>

        <main className="grid min-h-[calc(100vh-89px)] grid-cols-1 gap-8 bg-gray-50 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              {loading ? (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">{loadingLabel}</h3>
                  <p className="mt-2 text-sm text-gray-500">{scanProgress || "Fetching verification records"}</p>
                  {pdfInfo && (
                    <p className="mt-3 text-xs text-gray-400">
                      {pdfInfo.name} | {pdfInfo.pages} page(s) | {pdfInfo.size}
                    </p>
                  )}
                </div>
              ) : (
                <div className="min-h-[440px]">
                  {mode === "idle" && (
                    <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-200 bg-blue-50 text-blue-600">
                        <QrCode size={38} />
                      </div>
                      <h3 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Ready to verify
                      </h3>
                      <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
                        Choose a verification path from the left sidebar.
                      </p>
                    </div>
                  )}

                  {mode === "qrLive" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Live QR Scan</h3>
                          <p className="text-sm text-gray-500">Runs QR to database to blockchain verification.</p>
                        </div>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                          Live
                        </span>
                      </div>
                      <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-gray-100">
                        <video ref={videoRef} className="aspect-[16/10] w-full object-cover" autoPlay />
                        <div className="pointer-events-none absolute inset-8 rounded-[24px] border-2 border-blue-400/70" />
                      </div>
                    </div>
                  )}

                  {(mode === "qrImage" || mode === "certificateImage" || mode === "certificatePdf") && (
                    <div className="flex min-h-[440px] items-center justify-center">
                      <label className="w-full max-w-2xl cursor-pointer">
                        <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center transition-colors duration-200 hover:border-blue-400 hover:bg-blue-50/40">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500">
                            <Upload size={28} />
                          </div>
                          <h3 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
                            {mode === "qrImage" && "Upload QR image"}
                            {mode === "certificateImage" && "Upload certificate image"}
                            {mode === "certificatePdf" && "Upload certificate PDF"}
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            {mode === "qrImage" && "QR image runs database and blockchain verification."}
                            {mode === "certificateImage" && "Certificate image runs OCR, database, and blockchain verification."}
                            {mode === "certificatePdf" && "Certificate PDF runs OCR/text, database, and blockchain verification."}
                          </p>
                          <div className="mt-8 inline-flex rounded-xl border border-blue-500 px-5 py-2.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-500 hover:text-white">
                            Browse files
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept={mode === "certificatePdf" ? ".pdf" : "image/*"}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (mode === "qrImage") processQrImage(file);
                              if (mode === "certificateImage") processCertificateImage(file);
                              if (mode === "certificatePdf") processCertificatePdf(file);
                            }}
                          />
                        </div>
                      </label>
                    </div>
                  )}

                  {mode === "manual" && (
                    <div className="mx-auto flex min-h-[440px] max-w-2xl items-center">
                      <div className="w-full rounded-[28px] border border-gray-200 bg-gray-50 p-8">
                        <div className="mb-6 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-600">
                            <ScanLine size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Manual QR Input</h3>
                            <p className="text-sm text-gray-500">
                              Paste the QR ID, raw QR payload, or certificate hash for direct blockchain verification.
                            </p>
                          </div>
                        </div>
                        <input
                          ref={manualInputRef}
                          type="text"
                          placeholder="Enter QR ID, QR payload JSON, or certificate hash"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 font-mono text-sm text-gray-700 outline-none transition-colors duration-200 focus:border-blue-500"
                          onKeyDown={(e) => e.key === "Enter" && verifyManual(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => verifyManual(manualInputRef.current?.value || "")}
                            className="rounded-xl border border-blue-500 bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-blue-600"
                          >
                            Verify on blockchain
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Verification Results
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                  Status Panel
                </h2>
              </div>
              {verificationStatus && (
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
                  {STATUS_LABELS[verificationStatus] || verificationStatus}
                </span>
              )}
            </div>

            <div className="mt-6 space-y-5">
              {verificationSteps.length > 0 && (
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Step Status
                  </p>
                  <div className="mt-4 space-y-3">
                    {verificationSteps.map((step) => (
                      <div
                        key={step.name}
                        className={`rounded-2xl border p-4 ${
                          step.passed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border ${
                              step.passed
                                ? "border-emerald-200 bg-white text-emerald-600"
                                : "border-red-200 bg-white text-red-500"
                            }`}
                          >
                            {step.passed ? <CheckCircle2 size={18} /> : <CircleDashed size={18} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {step.label || STEP_LABELS[step.name] || step.name}
                              </p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  step.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                }`}
                              >
                                {step.passed ? "Passed" : "Failed"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-gray-600">{step.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!certificate && !error && verificationSteps.length === 0 && (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400">
                    <Info size={28} />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">Awaiting verification</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Step results and certificate details will appear here.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-500">
                      <XCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-900">Validation Error</h4>
                      <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      resetVerificationState();
                      setMode("idle");
                      setScanProgress("");
                      setPdfInfo(null);
                    }}
                    className="mt-6 w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-medium text-red-700 transition-colors duration-200 hover:bg-white"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {certificate && (
                <div className="flex flex-1 flex-col">
                  <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                      Credential
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                      {certificate.certificateTitle}
                    </h3>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Recipient", val: certificate.recipientName, icon: User },
                      { label: "Institution", val: certificate.institutionName, icon: Building },
                      { label: "Course", val: certificate.courseName, icon: BookOpen },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                          <item.icon size={14} />
                          {item.label}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{item.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                        <Calendar size={14} />
                        Issued
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(certificate.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                        <Hash size={14} />
                        Record ID
                      </div>
                      <p className="truncate font-mono text-xs font-semibold text-gray-800">
                        {certificate.qrCodeId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 rounded-xl border border-blue-500 bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-blue-600"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Printer size={16} />
                        Print
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        resetVerificationState();
                        setPdfInfo(null);
                        setScanProgress("");
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-600 transition-colors duration-200 hover:border-blue-400 hover:text-blue-600"
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </div>

                  {verificationDetails && (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                        Verification Details
                      </p>
                      <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-gray-600">
                        {JSON.stringify(verificationDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
