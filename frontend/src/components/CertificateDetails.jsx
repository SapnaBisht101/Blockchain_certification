import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Tempelete from "./Tempelate.jsx";
import handleDownloadPDF from "./Downloadpdf.js";
import { ArrowLeft, Download, Loader2, Award } from "lucide-react";

const CertificateDetails = () => {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            No Certificate Data Found
          </h2>

          <button
            onClick={() => navigate("/issuer")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
  console.log(certificate);
  

  return (
    <div className="min-h-screen w-full bg-slate-100">
      {/* FLOATING HEADER */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* LEFT : APP BRAND */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg  ">
              <img src="pnglogo.png" />
            </div>

            <span className="font-semibold text-blue-600 text-2xl tracking-tight">
              DECIVE
            </span>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {/* DOWNLOAD */}
            <button
              onClick={() =>
                handleDownloadPDF(
                  certificate.qrCodeImage,
                  certificate.qrCodeId,
                  setLoading,
                  showMessage,
                  certData,
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Generating
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download
                </>
              )}
            </button>

            {/* BACK BUTTON */}
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
              {" "}
              <ArrowLeft
                size={16}
                className="transition-transform duration-200 group-hover:-translate-x-1"
              />
              <span className="text-sm font-medium text-gray-700">Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* CERTIFICATE PREVIEW STAGE */}

      <div className="w-full overflow-auto px-4 py-6 lg:px-8">
        <div className="mx-auto flex min-w-fit justify-center">
          <Tempelete
            certData={certData}
            qrCodeImage={certificate.qrImage}
            qrCodeId={certificate.qrCodeId}
          />
        </div>

        {message && (
          <p className="text-center mt-6 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default CertificateDetails;
