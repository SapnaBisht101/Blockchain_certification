import React, { useEffect, useState } from "react";
import jsQR from "jsqr";
import { Upload, FileText, Loader, CheckCircle, XCircle, Download, AlertCircle, LogIn } from "lucide-react";

// Set up PDF.js worker
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

const ExtractQRFromPDF = ({verify}) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");
  const [pdfInfo, setPdfInfo] = useState(null);
  const [scanProgress, setScanProgress] = useState("");

  // Enhanced QR extraction with multiple strategies
  const extractQRFromPDF = async (file) => {
    setLoading(true);
    setError("");
    setQrData(null);
    setPdfInfo(null);
    setScanProgress("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      setPdfInfo({
        name: file.name,
        pages: pdf.numPages,
        size: (file.size / 1024).toFixed(2) + " KB"
      });

      console.log(`📄 PDF loaded: ${pdf.numPages} pages`);

      // Try multiple scales and strategies
      const scales = [3.0, 2.5, 2.0, 1.5]; // Higher scales first for better quality
      const inversionModes = ["dontInvert", "attemptBoth", "invertFirst"];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setScanProgress(`Scanning page ${pageNum} of ${pdf.numPages}...`);
        console.log(`🔍 Processing page ${pageNum}...`);

        const page = await pdf.getPage(pageNum);

        // Try different scales
        for (const scale of scales) {
          console.log(`  📐 Trying scale: ${scale}`);
          
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render page
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          // Try different inversion modes
          for (const inversionMode of inversionModes) {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Try to decode QR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: inversionMode,
            });

            if (code) {
              console.log(`✅ QR Code found! Page: ${pageNum}, Scale: ${scale}, Mode: ${inversionMode}`);
              setQrData({
                data: code.data,
                page: pageNum,
                scale: scale,
                inversionMode: inversionMode,
                location: code.location
              });
             
              
              setScanProgress("");
              setLoading(false);
              
              return;
            }
          }

          // Also try with image preprocessing (grayscale conversion)
          const processedImageData = preprocessImage(imageData);
          for (const inversionMode of inversionModes) {
            const code = jsQR(
              processedImageData.data, 
              processedImageData.width, 
              processedImageData.height, 
              { inversionAttempts: inversionMode }
            );

            if (code) {
              console.log(`✅ QR Code found with preprocessing! Page: ${pageNum}, Scale: ${scale}`);
              setQrData({
                data: code.data,
                page: pageNum,
                scale: scale,
                preprocessed: true,
                inversionMode: inversionMode,
                location: code.location
              });
              setScanProgress("");
              setLoading(false);
              return;
            }
          }
        }
      }

      // If no QR code found after all attempts
      setError("❌ No QR code detected. The QR might be too small, corrupted, or heavily styled. Try scanning with a camera or uploading a clearer PDF.");
      
    } catch (err) {
      console.error("PDF processing error:", err);
      setError(`⚠️ Failed to process PDF: ${err.message}`);
    } finally {
      setLoading(false);
      setScanProgress("");
    
      
    }
  };
useEffect(() => {
  if (!qrData) return;

  let raw = qrData.data;
  let certiid = null;

  try {
    // Try JSON parsing safely
    certiid = JSON.parse(raw);

    if (typeof certiid !== "object" || !certiid.qrCodeId) {
      throw new Error("Invalid certificate JSON structure");
    }

    // Pass correct ID
    verify(certiid.qrCodeId);
  } catch (err) {
    console.warn("Non-JSON / Invalid QR detected:", err.message);

    // If it's garbage text (like BOARD OF S...), avoid crash
    if (raw.length < 80) {
      // Treat as QR ID directly (fallback)
      verify(raw.trim());
    } else {
      // Too long → probably a paragraph → invalid
      setError("The scanned QR code does not contain valid certificate data.");
      
    }
  }
}, [qrData]);

  

  // Image preprocessing to improve QR detection
  const preprocessImage = (imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    
    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale conversion
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Increase contrast (simple threshold)
      const threshold = 128;
      const value = gray > threshold ? 255 : 0;
      
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
    }

    return {
      data: data,
      width: imageData.width,
      height: imageData.height
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF file is too large. Maximum size is 10MB.");
      return;
    }

    extractQRFromPDF(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      extractQRFromPDF(file);
    } else {
      setError("Please drop a valid PDF file");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrData.data);
    alert("✅ QR code data copied to clipboard!");
  };

  return (
    <div className="  bg-gradient-to-br from-slate-50 via-gray-300 to-gray-50 py-8 px-4  rounded-2xl">
      <div className="">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-600 rounded-2xl shadow-lg mb-4">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Extract QR from PDF
          </h1>
          <p className="text-gray-600 text-sm">
            Upload a certificate PDF to extract and decode the QR code
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl mb-6">
          <label
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="block"
          >
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-semibold mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PDF files only (max 10MB)
              </p>
              <input
               id="pdfInput"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
             <button
  type="button"
  onClick={() => document.getElementById("pdfInput").click()}
  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
>
  Browse Files
</button>
            </div>
          </label>
        </div>

        {/* Loading State with Progress */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <Loader className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-700 font-semibold mb-2">
              Processing PDF...
            </p>
            {scanProgress && (
              <p className="text-sm text-gray-600 font-medium">
                {scanProgress}
              </p>
            )}
            {pdfInfo && (
              <p className="text-sm text-gray-600 mt-2">
                Total pages: {pdfInfo.pages}
              </p>
            )}
            <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gray-600 h-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        )}

        {/* Error Message with Suggestions */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-800 font-bold mb-1">
                  Extraction Failed
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            
            {/* Troubleshooting Tips */}
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Troubleshooting Tips
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1 ml-6 list-disc">
                <li>Ensure the QR code is clearly visible in the PDF</li>
                <li>QR code should be at least 100x100 pixels</li>
                <li>Avoid heavily compressed or low-quality PDFs</li>
                <li>Try converting the PDF page to an image first</li>
                <li>Use a mobile device to scan the QR directly</li>
              </ul>
            </div>
          </div>
        )}

        {qrData && !loading &&false && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h2 className="text-2xl font-bold">QR Code Extracted ✓</h2>
              </div>
              <p className="text-green-100">
                Successfully found QR code on page {qrData.page}
                {qrData.preprocessed && " (with image preprocessing)"}
              </p>
            </div>

            {/* QR Data Content */}
            <div className="p-8">
              <div className="space-y-6">
                
                {/* PDF Info */}
                {pdfInfo && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">File Name</p>
                      <p className="font-semibold text-gray-900 text-sm truncate" title={pdfInfo.name}>
                        {pdfInfo.name}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Pages</p>
                      <p className="font-semibold text-gray-900">
                        {pdfInfo.pages}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">File Size</p>
                      <p className="font-semibold text-gray-900">
                        {pdfInfo.size}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detection Info */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-3">Detection Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Page: </span>
                      <span className="font-semibold">{qrData.page}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Scale: </span>
                      <span className="font-semibold">{qrData.scale}x</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mode: </span>
                      <span className="font-semibold text-xs">{qrData.inversionMode}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Preprocessed: </span>
                      <span className="font-semibold">{qrData.preprocessed ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Data */}
                <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    Extracted QR Code Data
                  </p>
                  <p className="text-lg font-mono font-bold text-gray-900 break-all">
                    {qrData.data}
                    
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Copy QR Data
                </button>
                <button
                  onClick={() => {
                    setQrData(null);
                    setError("");
                    setPdfInfo(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
                >
                  Extract Another
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ExtractQRFromPDF;