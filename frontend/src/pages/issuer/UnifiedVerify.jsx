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
} from "lucide-react";
import jsQR from "jsqr";
import { useMessage } from "../GlobalMessageProvider";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function UnifiedVerify() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();

  const [mode, setMode] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [scanProgress, setScanProgress] = useState("");
  const [pdfInfo, setPdfInfo] = useState(null);
  const videoRef = useRef(null);
  const manualInputRef = useRef(null);

  const resetVerificationState = useCallback(() => {
    setCertificate(null);
    setError("");
    setVerificationStatus(null);
    setVerificationDetails(null);
  }, []);

  const preprocessImage = useCallback((imageData) => {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const value = gray > 128 ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    return {
      data,
      width: imageData.width,
      height: imageData.height,
    };
  }, []);

  const verify = useCallback(
    async (qrData) => {
      if (!qrData || typeof qrData !== "string") {
        showMessage("Invalid or unreadable QR code.", "error");
        setError("Invalid QR code.");
        return;
      }

      setLoading(true);
      resetVerificationState();

      let qrCodeId = qrData;
      let clientData = {};

      try {
        const parsed = JSON.parse(qrData);
        clientData = parsed;
        qrCodeId = parsed.qrCodeId || qrData;
      } catch {
        clientData = { qrCodeId: qrData };
        qrCodeId = qrData;
      }

      if (!qrCodeId?.trim()) {
        showMessage("QR Code ID is missing or unreadable.", "error");
        setError("Missing QR Code ID.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/certificates/verify-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCodeId: qrCodeId.trim(), clientData }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          showMessage("Invalid server response. Verification failed.", "error");
          setError("Server returned invalid JSON.");
          setLoading(false);
          return;
        }

        if (data.valid) {
          showMessage("Authenticity Confirmed", "success");
          setCertificate(data.data);
          setVerificationStatus(data.status || "Verified");
          setVerificationDetails(data.details || null);
        } else {
          setError(data.message || "Credential record not found in ledger.");
          setVerificationStatus(data.status || "Invalid_ID");
          showMessage(data.message || "Verification Failed", "error");
        }
      } catch {
        setError("Network error. Connection to verification server failed.");
        setVerificationStatus("Error");
        showMessage("Network or server error. Could not verify.", "error");
      } finally {
        setLoading(false);
      }
    },
    [resetVerificationState, showMessage],
  );

  const extractVerifyableQRData = useCallback((rawData) => {
    if (!rawData || typeof rawData !== "string") return null;

    try {
      const parsed = JSON.parse(rawData);
      if (typeof parsed === "object" && parsed?.qrCodeId?.trim()) {
        return parsed.qrCodeId.trim();
      }
    } catch {}

    const trimmed = rawData.trim();
    if (!trimmed) return null;
    return trimmed.length < 80 ? trimmed : null;
  }, []);

  const processPDF = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
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

      const scales = [3.0, 2.5, 2.0, 1.5];
      const inversionModes = ["dontInvert", "attemptBoth", "invertFirst"];

      for (let i = 1; i <= pdf.numPages; i++) {
        setScanProgress(`Scanning page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);

        for (const scale of scales) {
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

          for (const inversionMode of inversionModes) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: inversionMode,
            });

            if (code) {
              const verifyableData = extractVerifyableQRData(code.data);
              if (verifyableData) {
                setScanProgress("");
                setLoading(false);
                await verify(verifyableData);
                return;
              }
            }
          }

          const processedImageData = preprocessImage(imageData);
          for (const inversionMode of inversionModes) {
            const code = jsQR(
              processedImageData.data,
              processedImageData.width,
              processedImageData.height,
              { inversionAttempts: inversionMode },
            );

            if (code) {
              const verifyableData = extractVerifyableQRData(code.data);
              if (verifyableData) {
                setScanProgress("");
                setLoading(false);
                await verify(verifyableData);
                return;
              }
            }
          }
        }
      }

      setError("No valid QR code detected. Try a clearer PDF or use camera scan.");
      showMessage("No QR code detected in the PDF.", "error");
    } catch {
      setError("Failed to process the PDF document.");
      showMessage("Failed to process the PDF document.", "error");
    } finally {
      setScanProgress("");
      setLoading(false);
    }
  };

  const processImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      showMessage("Please upload a valid image file.", "error");
      return;
    }

    setLoading(true);
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
      const attempts = [imageData, preprocessImage(imageData)];
      const inversionModes = ["dontInvert", "attemptBoth", "invertFirst"];

      for (const candidateImage of attempts) {
        for (const inversionMode of inversionModes) {
          const code = jsQR(
            candidateImage.data,
            candidateImage.width,
            candidateImage.height,
            { inversionAttempts: inversionMode },
          );

          if (code) {
            const verifyableData = extractVerifyableQRData(code.data);
            if (verifyableData) {
              URL.revokeObjectURL(objectUrl);
              setLoading(false);
              await verify(verifyableData);
              return;
            }
          }
        }
      }

      setError("No valid QR code found in image.");
      showMessage("No QR code detected in the image.", "error");
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      setError("Image load failed.");
      showMessage("Failed to load image.", "error");
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
    };
  };

  useEffect(() => {
    if (mode !== "camera") return;

    const reader = new BrowserMultiFormatReader();
    let controls = null;

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (result) {
          controls?.stop();
          verify(result.getText());
          setMode("idle");
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
  }, [mode, showMessage, verify]);

  const modeMeta = {
    camera: {
      title: "Camera Scan",
      description: "Use your device camera to detect the certificate QR.",
      short: "Live scan",
    },
    pdf: {
      title: "PDF Document",
      description: "Upload a certificate PDF and scan each page for QR data.",
      short: "Upload PDF",
    },
    upload: {
      title: "Image Upload",
      description: "Upload a screenshot or QR image for direct verification.",
      short: "Upload image",
    },
    manual: {
      title: "Manual Input",
      description: "Paste the certificate hash or raw QR payload manually.",
      short: "Paste ID",
    },
  };

  const activeModeMeta = modeMeta[mode];

  const SidebarItem = ({ icon: Icon, title, activeMode }) => (
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
          <p className="text-xs text-gray-400 group-hover:text-blue-500">
            {modeMeta[activeMode].short}
          </p>
        </div>
      </div>
    </button>
  );

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
            <span className="text-xl font-semibold tracking-tight text-blue-600">
              DECIVE
            </span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              Verification Hub
            </p>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Verify certificates from QR, PDF, image, or manual record input.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          <SidebarItem icon={Camera} title="Camera Scan" activeMode="camera" />
          <SidebarItem icon={FileText} title="PDF Document" activeMode="pdf" />
          <SidebarItem icon={Upload} title="Image Upload" activeMode="upload" />
          <SidebarItem icon={ScanLine} title="Manual Input" activeMode="manual" />
        </nav>

        <div className="p-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              <Shield size={14} />
              Security Active
            </div>
            <p className="text-sm leading-6 text-gray-600">
              End-to-end encrypted verification via decentralized ledger nodes.
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

        <main className="grid min-h-[calc(100vh-89px)] grid-cols-1 gap-8 bg-gray-50 px-8 py-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6">
         

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              {loading ? (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    {mode === "pdf" ? "Processing document..." : "Authenticating..."}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {scanProgress || "Fetching records from blockchain"}
                  </p>
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
                        Pick a method from the left sidebar to start certificate verification.
                      </p>
                    </div>
                  )}

                  {mode === "camera" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Live Camera Scan</h3>
                          <p className="text-sm text-gray-500">Place the QR code inside the frame.</p>
                        </div>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                          Live
                        </span>
                      </div>
                      <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-gray-100">
                        <video ref={videoRef} className="aspect-[16/10] w-full object-cover" autoPlay />
                        <div className="pointer-events-none absolute inset-8 rounded-[24px] border-2 border-blue-400/70 transition-colors duration-200" />
                      </div>
                    </div>
                  )}

                  {(mode === "pdf" || mode === "upload") && (
                    <div className="flex min-h-[440px] items-center justify-center">
                      <label className="w-full max-w-2xl cursor-pointer">
                        <div className="rounded-[28px] border border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center transition-colors duration-200 hover:border-blue-400 hover:bg-blue-50/40">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500">
                            <Upload size={28} />
                          </div>
                          <h3 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
                            {mode === "pdf" ? "Upload PDF certificate" : "Upload QR image"}
                          </h3>
                          <p className="mt-2 text-sm text-gray-500">
                            {mode === "pdf"
                              ? "Select a PDF file and scan it for a verifiable QR code."
                              : "Select an image containing the certificate QR code."}
                          </p>
                          <div className="mt-8 inline-flex rounded-xl border border-blue-500 px-5 py-2.5 text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-500 hover:text-white">
                            Browse files
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept={mode === "pdf" ? ".pdf" : "image/*"}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (mode === "pdf") processPDF(file);
                              else processImage(file);
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
                            <h3 className="text-lg font-semibold text-gray-900">Manual ID Entry</h3>
                            <p className="text-sm text-gray-500">
                              Paste the certificate hash or QR JSON payload.
                            </p>
                          </div>
                        </div>
                        <input
                          ref={manualInputRef}
                          type="text"
                          placeholder="Enter certificate hash or QR payload"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 font-mono text-sm text-gray-700 outline-none transition-colors duration-200 focus:border-blue-500"
                          onKeyDown={(e) => e.key === "Enter" && verify(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => verify(manualInputRef.current?.value || "")}
                            className="rounded-xl border border-blue-500 bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-blue-600"
                          >
                            Validate credential
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
              {certificate && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  {verificationStatus || "Verified"}
                </span>
              )}
            </div>

            <div className="mt-6 flex min-h-[620px] flex-col">
              {!certificate && !error && (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-400">
                    <Info size={28} />
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">Awaiting data input</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    Results will appear here once a certificate is scanned or submitted.
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
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-colors duration-200 hover:border-blue-300"
                      >
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
                        setCertificate(null);
                        setVerificationStatus(null);
                        setVerificationDetails(null);
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
                      <pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-gray-600">
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
