import React, { useState, useCallback, useEffect } from "react";
import { useMessage } from "../GlobalMessageProvider";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { fetchUserDetails } from "../../js/fetch";
import { useLocation } from "react-router";

// Utility: Converts File object to Base64 string
const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
    reader.onerror = (e) => rej(e);
  });


// Custom Hook for Drag and Drop
const useDragAndDrop = (onDrop) => {
  const h = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const hO = useCallback(
    (e) => {
      h(e);
      e.currentTarget.classList.add("border-indigo-500", "bg-indigo-50");
    },
    [h]
  );
  const hL = useCallback(
    (e) => {
      h(e);
      e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50");
    },
    [h]
  );
  const hD = useCallback(
    (e) => {
      h(e);
      e.currentTarget.classList.remove("border-indigo-500", "bg-indigo-50");
      if (e.dataTransfer.files?.[0]) onDrop(e.dataTransfer.files[0]);
    },
    [onDrop, h]
  );
  return { hO, hL, hD };
};

const CertificateGenerator = () => {
  const {showMessage} = useMessage();
  
  const location = useLocation();
  const issuerDetails = location.state;

  const initialDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Initialize certData with defaults/issuerDetails
  const [certData, setCertData] = useState({
    name: "Recipient Name",
    courseName: "Course Name",
    // Issuer details are pre-filled and not editable from the form
    issuerName: issuerDetails?.issuerName || "Jane Doe",
    issuerTitle: issuerDetails?.issuerTitle || "Director of Training",
    institutionName: issuerDetails?.institutionName || "Institution Name",
    completionDate: initialDate,
    certificateTitle: "CERTIFICATE OF ACHIEVEMENT",
    certificateDescription:
      "For outstanding dedication and successful completion of the prestigious program in",
    logoImage: issuerDetails?.institutionLogo || null,
    signatureImage: issuerDetails?.signatureImage || null,
    backgroundImage: null,
  });

  const [studentemail, setstudentemail] = useState("");
  // Verifier Email is now read-only and used only in API calls
  const [verifieremail, setverifierEmail] = useState(
    issuerDetails?.email || ""
  );
  
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [qrCodeId, setQrCodeId] = useState(null);
 
  const [loading, setLoading] = useState(false);

  // --- Data Fetching Logic ---
  const fetchStudentDetails = async () => {
    if (!studentemail) return showMessage("Please enter a Student Email.","error");
    setLoading(true);
    showMessage("Fetching student details...");
    try {
      const data = await fetchUserDetails("student", studentemail);
      console.log(data);
      
      setCertData((prev) => ({
        ...prev,
        name: data.name,
        completionDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));
showMessage(
  `Student "${data.name}" (${studentemail}) found. You can proceed with certificate generation.`,
  "success"
);
    } catch (err) {
  if (err.status === 404) {
    showMessage(`Student not found: ${studentemail}`, "error");
  } else {
    showMessage(`Error: ${err.message}`, "error");
  }
} finally {
      setLoading(false);
    }
  };

  // --- Form & Image Handlers (Modified for simpler form) ---
  const handleChange = (e) =>
    setCertData({ ...certData, [e.target.name]: e.target.value });

  const handleImageFileChange = async (e, field) => {
    const file = e.target.files ? e.target.files[0] : e;
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setCertData((p) => ({ ...p, [field]: base64 }));
      } catch (error) {
        console.error("Error converting file:", error);
      }
    }
  };

  const handleClearImage = (field) => {
    setCertData((p) => ({ ...p, [field]: null }));
    showMessage("");
  };

  // Only Background Drag and Drop is needed now
  const {
    hO: bgDragO,
    hL: bgDragL,
    hD: bgDrop,
  } = useDragAndDrop((f) => handleImageFileChange(f, "backgroundImage"));

  // --- QR Code Generation (API call to save provisional data) ---
const handleGenerateQrCode = async () => {
  if (!certData.name || certData.name === "Recipient Name")
    return showMessage("Please fetch student details or enter recipient name.","error");
  
  setLoading(true);
  showMessage("Generating QR code and saving data...");
  
  try {
    const payload = {
      studentName: certData.name,
      studentEmail: studentemail,
      courseName: certData.courseName,
      completionDate: certData.completionDate,
      issuerName: certData.issuerName,
      institutionName: certData.institutionName,
      certificateTitle: certData.certificateTitle,
      certificateDescription: certData.certificateDescription,
    };

    console.log('API Request Payload:', payload);
    
    const res = await axios.post("http://localhost:4000/certificates/generate-qr", payload);
    console.log('API Response:', res.data);
    
    if (!res.data || !res.data.certificate) {
      throw new Error('Invalid API response format');
    }
    
    const { qrCodeId } = res.data.certificate;
    const qrCodeUrl = res.data.qrCodeUrl;
    console.log('Received QR Data:', { qrCodeId, qrCodeUrl });
    
    setQrCodeId(qrCodeId);
    setQrCodeImage(qrCodeUrl);
    
    console.log('Updated State:', {
      qrCodeImage: qrCodeImage,
      qrCodeId: qrCodeId
    });
    
    showMessage(`QR Code generated ✅ ID: ${qrCodeId}`);
  } catch (e) {
    console.error('Error:', e.message);
    showMessage("QR generation failed ❌");
  } finally {
    setLoading(false);
  }
};


  // --- Download and Save Logic (Unchanged) ---
const handleDownloadPDF = async () => {
  if (!qrCodeImage || !qrCodeId) {
    showMessage("Please generate the QR code before downloading the PDF.");
    return;
  }

  const element = document.getElementById("cert-template");
  if (!element) {
    showMessage("Error: Template not found.");
    return;
  }

  setLoading(true);
  showMessage("Generating PDF...");

  try {
    // Capture high-quality render of the certificate
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Create PDF in real A4 landscape dimension
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Draw image to fill entire PDF page edge-to-edge
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

    const fileName = `${certData.name.replace(/\s+/g, "_")}_Certificate_${qrCodeId}.pdf`;
    pdf.save(fileName);

 

  

    showMessage("✅ Certificate downloaded ");

  } catch (error) {
    console.error("PDF generation failed:", error);
    showMessage("❌ PDF generation failed. Please try again.");
  } finally {
    setLoading(false);
  }
};


const InstitutionHeader = ({ logo, name }) => (
  <div style={{ textAlign: "center", marginBottom: "25px" }}>
    <div
      style={{
        height: "90px",
        width: "90px",
        margin: "0 auto 15px auto",
        borderRadius: "10px",
        overflow: "hidden",
        border: "2px solid #1e3a8a22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffffaa",
        backdropFilter: "blur(4px)",
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt="Institution Logo"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>LOGO</span>
      )}
    </div>

    <h2
      style={{
        fontSize: "30px",
        fontWeight: "900",
        color: "#1e3a8a",
        textTransform: "uppercase",
        letterSpacing: "2px",
        margin: 0,
        fontFamily:"Time New Roman"
      }}
    >
      {name}
    </h2>
  </div>
);

const CertificateTemplate = () => (
  <div
    id="cert-template"
    style={{
      position: "relative",
      width: "300mm",
      height: "300mm",
      padding: "18mm",
background: "linear-gradient(135deg, #f0f7ff, #d6e8ff, #b5d4ff, #89bfff)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      fontFamily: "Inter, Georgia, serif",
      boxShadow: "0 4px 25px rgba(0,0,0,0.15)",
      borderRadius: "8px",
      margin: "0 auto",
      boxSizing: "border-box",
    }}
  >
    {/* Outer Border */}
    <div
      style={{
        position: "absolute",
        top: "10mm",
        left: "10mm",
        right: "10mm",
        bottom: "10mm",
        border: "2px solid #1e3a8a55",
        borderRadius: "10px",
        pointerEvents: "none",
      }}
    />

    {/* Soft Inner Border */}
    <div
      style={{
        position: "absolute",
        top: "12mm",
        left: "12mm",
        right: "12mm",
        bottom: "12mm",
        border: "1px solid #1e3a8a33",
        borderRadius: "8px",
        pointerEvents: "none",
      }}
    />

    {/* Content */}
    <div
      style={{
        position: "relative",
        zIndex: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <InstitutionHeader
          logo={certData.logoImage}
          name={certData.institutionName}
        />

        <h1
          style={{
            fontSize: "52px",
            fontWeight: "900",
            color: "#1e3a8a",
            textTransform: "uppercase",
            letterSpacing: "6px",
            margin: "0",
          }}
        >
          {certData.certificateTitle}
        </h1>

        <div
          style={{
            width: "160px",
            height: "4px",
            margin: "12px auto",
            background: "linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* BODY */}
      <div style={{ textAlign: "center", marginTop: "10mm" }}>
        <p
          style={{
            fontSize: "20px",
            color: "#1e3a8a99",
            fontStyle: "italic",
            marginBottom: "10px",
          }}
        >
          Proudly Presented To
        </p>

        <h2
          style={{
            fontSize: "46px",
            fontWeight: "900",
            color: "#1e3a8a",
            borderBottom: "4px solid #3b82f6",
            display: "inline-block",
            padding: "0 15px 5px 15px",
            margin: "0",
            letterSpacing: "2px",
          }}
        >
          {certData.name}
        </h2>

        <p
          style={{
            fontSize: "18px",
            color: "#1e293b",
            maxWidth: "80%",
            margin: "20px auto 0 auto",
            lineHeight: "1.6",
          }}
        >
          {certData.certificateDescription}
        </p>

        <h3
          style={{
            fontSize: "30px",
            fontWeight: "800",
            marginTop: "18px",
            color: "#1e3a8a",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          {certData.courseName}
        </h3>
      </div>

      {/* FOOTER */}
      <div>
        {/* Date */}
        <div
          style={{
            textAlign: "center",
            margin: "20px 0",
            padding: "15px 0",
            borderTop: "2px solid #1e3a8a33",
            borderBottom: "2px solid #1e3a8a33",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#475569",
              marginBottom: "5px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Date of Completion
          </p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#1e3a8a",
              margin: 0,
            }}
          >
            {certData.completionDate}
          </p>
        </div>

        {/* Signature + QR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            padding: "0 25px",
          }}
        >
          {/* Signature */}
          <div style={{ width: "35%", textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                height: "70px",
                borderBottom: "2px solid #1e3a8a",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingBottom: "5px",
              }}
            >
              {certData.signatureImage ? (
                <img
                  src={certData.signatureImage}
                  alt="Signature"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  SIGNATURE
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e3a8a",
                marginBottom: "3px",
              }}
            >
              {certData.issuerName}
            </p>
            <p
              style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}
            >
              {certData.issuerTitle}
            </p>
          </div>

          {/* QR Code */}
          {qrCodeImage && (
            <div style={{ textAlign: "center" }}>
              <img
                src={qrCodeImage}
                alt="QR Code"
                style={{
                  width: "105px",
                  height: "105px",
                  objectFit: "contain",
                  background: "#ffffff",
                  padding: "6px",
                  border: "2px solid #1e3a8a",
                  borderRadius: "6px",
                }}
              />
              <p
                style={{
                  fontSize: "10px",
                  color: "#475569",
                  marginTop: "5px",
                }}
              >
                Scan to Verify
              </p>
            </div>
          )}
        </div>

        {/* Cert ID */}
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontSize: "11px",
            color: "#475569",
            letterSpacing: "1px",
          }}
        >
          Certificate ID: {qrCodeId || "XXXX-XXXX-XXXX"}
        </div>
      </div>
    </div>
  </div>
);



  return (
    <div className="min-h-screen w-full flex justify-center p-4 lg:p-10 font-sans">
      {/* Main Container - Divided into two flexible columns */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row lg:space-x-8">
          {/* Left Column: Controls (Smaller/Fixed Width on large screens) */}
          <div className="lg:w-1/3 w-full  border border-gray-200 rounded-xl shadow-lg p-6 mb-6 lg:mb-0 lg:sticky lg:top-10 lg:h-fit">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              QR Certify 
            </h2>

            {/* Status Message */}
            {status && (
              <p
                className={`mb-4 text-sm font-medium p-2 rounded-lg ${
                  qrCodeImage
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-blue-100 text-blue-700 border border-blue-300"
                }`}
              >
                {status}
              </p>
            )}

            {/* Verifier Info (Read-Only) */}
            <div className="mb-6 pb-4 border-b border-gray-100">
              <label className="block text-xs font-medium text-gray-500">
                ISSUER: {certData.issuerName} ({certData.issuerTitle})
              </label>
              <label className="block text-xs font-medium text-gray-500">
                INSTITUTION: {certData.institutionName}
              </label>
              <label className="block text-xs font-medium text-gray-500">
                VERIFIER EMAIL: {verifieremail}
              </label>
            </div>

            {/* Student Data Fetch */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                1. Student Email (Fetch Details)
              </label>
              <input
                type="text"
                value={studentemail}
                onChange={(e) => setstudentemail(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="student@example.com"
              />
              <button
                onClick={fetchStudentDetails}
                disabled={loading}
                className="mt-2 w-full py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition duration-300 disabled:opacity-50"
              >
                Fetch Student Details
              </button>
              <label className="block text-xs font-medium text-gray-500 mt-2">
                Current Recipient Name: {certData.name}
              </label>
            </div>

            {/* Editable Certificate Text Fields */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {Object.entries({
                courseName: "Course/Program Title",
                certificateTitle: "Certificate Main Title",
                completionDate: "Date of Completion",
              }).map(([k, l]) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-gray-700">
                    {l}
                  </label>
                  <input
                    type="text"
                    name={k}
                    value={certData[k]}
                    onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Certificate Description (Custom Text)
                </label>
                <textarea
                  name="certificateDescription"
                  value={certData.certificateDescription}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                ></textarea>
              </div>
            </div>


            {/* Actions */}
            <div className="flex flex-col space-y-3 mt-6 border-t pt-4">
              <button
                onClick={handleGenerateQrCode}
                disabled={loading || qrCodeImage}
                className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 disabled:opacity-50"
              >
                {qrCodeImage
                  ? `QR Generated: ${qrCodeId}`
                  : loading
                  ? "Generating..."
                  : "2. Generate QR Code & Save Details"}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={loading || !qrCodeImage}
                className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? "Generating PDF..." : "3. Download Certificate (PDF)"}
              </button>
            </div>
          </div>

        {/* Right Column: Certificate Preview (Larger/Flexible Width) */}
        <div className="lg:w-2/3 w-full flex justify-center">
          <CertificateTemplate />
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
