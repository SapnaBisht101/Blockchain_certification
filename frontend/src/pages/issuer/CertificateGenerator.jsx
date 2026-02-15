import React, { useState, useCallback, useEffect } from "react";
import { useMessage } from "../GlobalMessageProvider.jsx";
import axios from "axios";
import { fetchUserDetails } from "../../js/fetch.js";
import { useLocation } from "react-router";
import Tempelate from "../../components/Tempelate.jsx"
import handleDownloadPDF from "../../components/Downloadpdf.js";

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
  console.log(issuerDetails);
  
  
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

  let  stemail = issuerDetails.studentEmail
  console.log(stemail);
  
  const [studentemail, setstudentemail] = useState(stemail?stemail:"");
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

  // Only Background Drag and Drop is needed now
  const {
    hO: bgDragO,
    hL: bgDragL,
    hD: bgDrop,
  } = useDragAndDrop((f) => handleImageFileChange(f,"backgroundImage"));

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
                1. Student Email
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
  disabled={!studentemail || loading} // disabled if no email or loading
  className={`
    mt-2 w-full py-2 font-semibold rounded-lg transition-all duration-300
    ${studentemail ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : 'bg-gray-600 cursor-not-allowed'}
    text-white
    disabled:opacity-50
  `}
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
                  ? `Certificate Issued Successfully: ${qrCodeId}`
                  : loading
                  ? "Generating..."
                  : "2. Issue Certificate"}
              </button>
              <button
                onClick={()=>handleDownloadPDF(qrCodeImage,qrCodeId,setLoading,showMessage,certData)}
                disabled={loading || !qrCodeImage}
                className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? "Generating PDF..." : "3. Download Certificate (PDF)"}
              </button>
            </div>
          </div>

        {/* Right Column: Certificate Preview (Larger/Flexible Width) */}
        <div className="lg:w-2/3 w-full flex justify-center">
          <Tempelate certData={certData} qrCodeImage = {qrCodeImage} qrCodeId = {qrCodeId} />
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
