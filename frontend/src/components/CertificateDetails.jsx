import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Tempelete from "./Tempelate.jsx"; // adjust path
import handleDownloadPDF from "./Downloadpdf.js"; // adjust path

const CertificateDetails = () => {
  console.log("i am certi-details page ");
  
  const location = useLocation();
  const navigate = useNavigate();

  const certificate = location.state?.cert;  

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">
            No Certificate Data Found
          </h2>
          <button
            onClick={() => navigate("/issuer")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Convert certificate object into certData format required by Template
  console.log(certificate);
  
  const certData = {
    name: certificate.recipientName,
    certificateTitle: certificate.certificateTitle,
    certificateDescription: certificate.certificateDescription,
    courseName: certificate.courseName,
    completionDate: certificate.completionDate,
    issuerName: certificate.issuerName,
    issuerTitle: certificate.issuerTitle,
    institutionName: certificate.institutionName,
    logoImage: certificate.logoImage,
    signatureImage: certificate.signatureImage,
  };
  console.log(certData);
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Certificate Preview</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          ← Back
        </button>
      </div>

      {/* Template Preview */}
      <div className="overflow-auto bg-white p-4 rounded-xl shadow-lg">
        <Tempelete
          certData={certData}
          qrCodeImage={certificate.qrCodeImage}
          qrCodeId={certificate.qrCodeId}
        />
      </div>

      {/* Download Section */}
      <div className="text-center mt-8">
        <button
          onClick={() =>
            handleDownloadPDF(
              certificate.qrCodeImage,
              certificate.qrCodeId,
              setLoading,
              showMessage,
              certData
            )
          }
          className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          {loading ? "Generating PDF..." : "Download Certificate"}
        </button>

        {message && (
          <p className="mt-3 text-sm font-medium text-gray-700">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default CertificateDetails;
