import React from "react";
import { useLocation, useNavigate } from "react-router-dom"; // 🔑 Import useLocation

// Utility function (Keep this consistent)
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const CertificateDetails = () => {
  // 🔑 CRITICAL CHANGE: Use useLocation to get the data
  const location = useLocation();
  const navigate = useNavigate();

  // Extract the certificate object from the state. 
  // We named it 'certificate' when sending, so we access location.state.certificate.
  const certificate = location.state.cert; 
  console.log(certificate);
  
  // NOTE: With this method, you don't need the useEffect hook for fetching data.

  if (!certificate) {
    // If someone tries to access this page directly, the state will be empty.
    return (
      <div className="min-h-screen bg-gray-50 p-12">
        <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error: No Data Found</h2>
          <p className="text-gray-700">Certificate data was not passed. Please return to the dashboard and select a certificate.</p>
          <button
            onClick={() => navigate("/issuer")} // Go back to the issuer dashboard
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Display UI for Certificate Details (Now using the passed 'certificate' object) ---
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      
      {/* Navbar/Header area (Simplified) */}
      <div className="container mx-auto max-w-4xl flex justify-between items-center py-4 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Certificate Details</h1>
        <button
          onClick={() => navigate(-1)} // navigate(-1) goes back to the previous page (Issuer Dashboard)
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Detail Card */}
      <div className="p-10 max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100">
        
        {/* Certificate Title */}
        <div className="text-center mb-10">
          <p className="text-sm uppercase tracking-widest text-indigo-600 font-semibold mb-1">
            {certificate.institutionName}
          </p>
          <h2 className="text-4xl font-black text-gray-900 leading-tight">
            {certificate.certificateTitle || "CERTIFICATE ISSUED"}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          
          {/* Recipient Block */}
          <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-200">
            <h3 className="text-xl font-bold text-indigo-700 mb-2">Recipient Info</h3>
            <p className="text-gray-700">
              <span className="font-semibold block text-sm uppercase tracking-wider text-indigo-500">Name:</span> 
              <span className="text-lg font-medium">{certificate.recipientName}</span>
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold block text-sm uppercase tracking-wider text-indigo-500">Student ID:</span> 
              <span className="font-mono text-sm">{certificate.studentId}</span>
            </p>
          </div>

          {/* Course/Program Block */}
          <div className="p-5 bg-gray-100 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-700 mb-2">Program Details</h3>
            <p className="text-gray-700">
              <span className="font-semibold block text-sm uppercase tracking-wider text-gray-500">Course/Program:</span> 
              <span className="text-lg font-medium">{certificate.courseName}</span>
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold block text-sm uppercase tracking-wider text-gray-500">Completion Date:</span> 
              {formatDate(certificate.completionDate)}
            </p>
          </div>
        </div>
        
        {/* Full Description / Footer */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="font-semibold block text-sm uppercase tracking-wider text-gray-500 mb-2">Certificate Description</p>
          <p className="text-gray-700 italic">
            "{certificate.certificateDescription}"
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm border-t border-gray-200 pt-6">
          <div>
            <p className="font-semibold text-gray-500">Issued By</p>
            <p className="text-gray-800 font-medium">{certificate.issuerName}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Issued On</p>
            <p className="text-gray-800 font-medium">{formatDate(certificate.issuedAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500"> ID</p>
            <p className="font-mono text-xs text-indigo-600 break-all">{certificate.qrCodeId}</p>
          </div>
        </div>

        {/* Action Button (e.g., Download or Print) */}
        <div className="text-center mt-10">
            <button
                className="px-8 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-700 font-semibold transition duration-200 shadow-lg"
                onClick={() => alert("Simulating PDF download...")}
            >
                Download Certificate PDF
            </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateDetails;