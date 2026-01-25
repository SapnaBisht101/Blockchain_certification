import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Shield, CheckCircle, XCircle, FileText, Camera, Upload, ArrowRight, User,
  BookOpen, Calendar, Building, Award, AlertCircle, Loader, ScanLine,
  Gavel, AlertTriangle, Zap
} from "lucide-react";
import { useMessage } from "../GlobalMessageProvider";   // <-- your hook
import VerifyPdf from "./Pdfverify"
export default function VerifyCertificate() {
  const { showMessage } = useMessage();

  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const videoRef = useRef(null);

  // MASTER VERIFY FUNCTION (now 100% crash-safe)
  const verify = useCallback(async (qrCodeData) => {
    if (!qrCodeData || typeof qrCodeData !== "string") {
      showMessage("Invalid or unreadable QR code.", "error");
      setError("Invalid QR code");
      return;
    }

    console.log("Verifying QR:", qrCodeData);

    setLoading(true);
    setError("");
    setCertificate(null);
    setVerificationStatus(null);
    setVerificationDetails(null);

    let clientData = {};
    let qrCodeId = qrCodeData;

    // Safe JSON parsing
    try {
      const parsed = JSON.parse(qrCodeData);
      clientData = parsed;
      qrCodeId = parsed.qrCodeId || qrCodeData;
    } catch {
      clientData = { qrCodeId: qrCodeData };
      qrCodeId = qrCodeData;
    }

    if (!qrCodeId?.trim()) {
      showMessage("QR Code ID is missing or unreadable.", "error");
      setError("Missing QR Code ID");
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
        data = await res.json(); // JSON.parse crash handled
      } catch {
        showMessage("Invalid server response. Verification failed.", "error");
        setError("Server returned invalid JSON.");
        setLoading(false);
        return;
      }

      if (data.valid) {
        showMessage("Certificate verification successful.", "success");
        setCertificate(data.data);
        setVerificationStatus(data.status);
        setVerificationDetails(data.details || null);
      } else {
        showMessage(data.message || "Certificate not found.", "error");
        setError(data.message || "Verification failed.");
        setVerificationStatus(data.status || "Invalid_ID");
      }
    } catch (err) {
      console.error("Verification Error:", err);
      showMessage("Network or server error. Could not verify.", "error");
      setError("Server/Network error");
      setVerificationStatus("Error");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // FILE UPLOAD → PDF/IMAGE QR extraction (fully safe now)
  const handleFileUpload = async (file) => {
    if (!file) {
      showMessage("No file selected.", "neutral");
      return;
    }

    setLoading(true);
    setError("");
    setCertificate(null);
    setVerificationStatus(null);

    try {
      const formData = new FormData();
      formData.append("qrImage", file);

      const res = await fetch("http://localhost:4000/certificates/extract-qr", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await res.json(); 
      } catch {
        showMessage("Could not read server response.", "error");
        setError("Invalid JSON response");
        setLoading(false);
        return;
      }

      if (data.qrData) {
        showMessage("QR detected. Verifying certificate...", "neutral");
        await verify(data.qrData);
      } else {
        showMessage("No QR code detected in the file.", "error");
        setError("No QR found in uploaded PDF/image.");
      }
    } catch (e) {
      console.error("Extract QR Error:", e);
      showMessage("Failed to process file. Try again.", "error");
      setError("File processing failed.");
    } finally {
      setLoading(false);
    }
  };

  // MANUAL ENTRY
  const handleManualEntry = () => {
    const qrData = prompt("Enter Certificate QR Code ID or JSON:");
    if (qrData) {
      showMessage("Verifying entered data...", "neutral");
      verify(qrData);
    }
  };

  // CAMERA SCANNER
  useEffect(() => {
    if (scanMode !== "camera") return;

    const reader = new BrowserMultiFormatReader();
    let controls = null;

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          showMessage("QR detected. Verifying...", "success");
          controls?.stop();
          verify(result.getText());
          setScanMode(null);
        }
      })
      .then((dc) => (controls = dc))
      .catch(() => {
        showMessage("Camera unavailable or permission denied.", "error");
        setScanMode(null);
      });

    return () => controls?.stop();
  }, [scanMode, verify, showMessage]);

  // light card div

  const LightCard = ({colSpan, onClick, icon: Icon, title, subtitle, accentColor }) => (

    
    <button
      onClick={onClick}
      className={`group bg-white border ${colSpan}  border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all`}
    >
      <div className={`flex justify-between`}>
        <div className={`w-12 h-12 rounded-xl flex items-center  justify-center bg-gray-50 ${accentColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mt-4">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </button>
  );


 return (
  <div className=" w-full h-screen flex  items-center  px-6  py-10 font-sans">
    <div className="w-7xl  mx-auto">

      {/* Mode Selection */}
      {!scanMode && !certificate && (
      <div className=" w-full text-gray-900 font-sans selection:bg-blue-100 flex items-center justify-center  relative overflow-hidden">

      {/* --- Main Container --- */}
      <div className="relative z-10 w-full max-w-4xl">
        
        {/* Card with Glassmorphism (Frosted Glass) */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 ">
          
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Choose Verification Method
            </h2>
            <p className="text-gray-500 mt-2 text-base">
              Select how you would like to verify the certificate credentials.
            </p>
          </div>

          {/* Grid System */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. Camera (Spans 2 cols) */}
            <LightCard
              colSpan="md:col-span-2"
              onClick={() => setScanMode("camera")}
              icon={Camera}
              title="Scan with Camera"
              subtitle="Use your device camera for instant scan"
              bgHover="group-hover:bg-blue-50/50"
              ringColor="group-hover:ring-blue-100"
            />

            {/* 2. Upload Image (Spans 1 col) */}
            <LightCard
              onClick={() => setScanMode("upload")}
              icon={Upload}
              title="Upload Image"
              subtitle="Select from gallery"
              bgHover="group-hover:bg-purple-50/50"
              ringColor="group-hover:ring-purple-100"
            />

            {/* 3. Manual Entry (Spans 1 col) */}
            <LightCard
              onClick={handleManualEntry}
              icon={ScanLine}
              title="Manual Entry"
              subtitle="Type ID manually"
              bgHover="group-hover:bg-emerald-50/50"
              ringColor="group-hover:ring-emerald-100"
            />

            {/* 4. PDF Upload (Spans 2 cols) */}
            <LightCard
              colSpan="md:col-span-2"
              onClick={() => setScanMode("pdf")}
              icon={FileText}
              title="Upload PDF Document"
              subtitle="Analyze certificate directly from a PDF file"
              bgHover="group-hover:bg-orange-50/50"
              ringColor="group-hover:ring-orange-100"
            />

          </div>
        </div>
      </div>
    </div>
      )}

      {/* Camera Scanner */}
      {scanMode === "camera" && (
        <div className="bg-white border rounded-2xl shadow-sm p-8 mt-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Camera Scanner</h2>
            <button onClick={() => setScanMode(null)} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
          </div>

          <div className="rounded-xl overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay />
          </div>

          <p className="text-gray-500 text-sm mt-3 text-center">Align the QR code inside the frame</p>
        </div>
      )}

      {scanMode==="pdf" && (
            <VerifyPdf verify={verify}/>
          )}

      {/* Upload QR */}
      {scanMode === "upload" && (
        <div className="bg-white border rounded-2xl shadow-sm p-8 mt-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upload QR</h2>
            <button onClick={() => setScanMode(null)} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
          </div>

          <label>
            <div className="border-2 border-dashed rounded-xl p-10 text-center hover:bg-gray-50 transition cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Click or drag image here</p>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
            </div>
          </label>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border rounded-2xl shadow-sm p-8 mt-6 text-center">
          <Loader className="w-8 h-8 text-gray-700 mx-auto animate-spin mb-3" />
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      )}

      

      {/* Certificate Details */}
      {certificate && !loading && verificationStatus !== "Revoked" && (
        <div className="bg-white border rounded-2xl shadow-sm p-10 mt-10">

          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Verification Details</h2>

          {/* Main Certificate Card */}
          <div className="bg-gray-50 border rounded-xl p-8">

            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-7 h-7 text-green-600" />
              <p className="text-lg font-medium text-gray-900">Certificate Verified</p>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{certificate.certificateTitle}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="border rounded-xl p-5 bg-white">
                <User className="w-6 h-6 text-gray-600 mb-1" />
                <p className="text-sm text-gray-500">Recipient</p>
                <p className="text-lg font-medium text-gray-900">{certificate.recipientName}</p>
              </div>

              <div className="border rounded-xl p-5 bg-white">
                <BookOpen className="w-6 h-6 text-gray-600 mb-1" />
                <p className="text-sm text-gray-500">Course</p>
                <p className="text-lg font-medium text-gray-900">{certificate.courseName}</p>
              </div>

              <div className="border rounded-xl p-5 bg-white">
                <Building className="w-6 h-6 text-gray-600 mb-1" />
                <p className="text-sm text-gray-500">Issued By</p>
                <p className="text-lg font-medium text-gray-900">{certificate.issuerName}</p>
                <p className="text-sm text-gray-500">{certificate.institutionName}</p>
              </div>

              <div className="border rounded-xl p-5 bg-white">
                <Calendar className="w-6 h-6 text-gray-600 mb-1" />
                <p className="text-sm text-gray-500">Completion Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(certificate.completionDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

            </div>

            <div className="mt-8 p-4 bg-white rounded-xl border">
              <p className="text-sm text-gray-500">Certificate ID</p>
              <p className="font-mono text-lg font-semibold text-gray-900">{certificate.qrCodeId}</p>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setCertificate(null);
                  setError("");
                  setScanMode(null);
                  setVerificationStatus(null);
                }}
                className="px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition"
              >
                Verify Another
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-3 border rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Print
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-full shadow-sm">
          <AlertCircle className="w-4 h-4 text-gray-600" />
          <p className="text-sm text-gray-600">Use the QR from the original certificate</p>
        </div>
      </div>

    </div>
  </div>
);

}
