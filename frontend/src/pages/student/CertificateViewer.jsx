
import React, { useState, useEffect } from "react"; 
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Download, X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

// --- Utility: Date Format ---
const formatDateForCert = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}


//  QR CODE GENERATOR (Remains largely the same) 
const generateQrDataUrl = async (certData) => {
    if (!certData || !certData.qrCodeId) return null;

    const payload = {
        qrCodeId: certData.qrCodeId,
        studentName: certData.recipientName,
        courseName: certData.courseName,
        issuerName: certData.issuerName,
        institutionName: certData.institutionName,
        issuedAt: certData.issuedAt
    };

    try {
        // Generate QR Code Image as a Data URL (Base64)
        const qrphoto = await QRCode.toDataURL(JSON.stringify(payload), {
            errorCorrectionLevel: 'H',
            type: 'image/jpeg', // Use JPEG for better compatibility with html2canvas/jsPDF
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000', // Dark blue
                light: '#ffffff'
            }
        });
        return qrphoto;
    } catch (error) {
        console.error("QR Code generation failed:", error);
        return null;
    }
}


// ---------------------- Institution Header Component ----------------------
const InstitutionHeader = ({ logo, name }) => (
    <div style={{ textAlign: "center", marginBottom: "25px" }}>
        {/* ... (Your original InstitutionHeader styling remains here) ... */}
        <div
            style={{
                height: "90px", width: "90px", margin: "0 auto 15px auto", borderRadius: "10px",
                overflow: "hidden", border: "2px solid #1e3a8a22", display: "flex",
                alignItems: "center", justifyContent: "center", background: "#ffffffaa",
               
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
                fontSize: "30px", fontWeight: "900", color: "#1e3a8a", textTransform: "uppercase",
                letterSpacing: "2px", margin: 0, fontFamily: "Times New Roman",
            }}
        >
            {name}
        </h2>
    </div>
);


const CertificateViewer = ({
    certData = {},

    qrCodeId,
    onClose,
}) => {
  
    const [qrImage, setQrImage] = useState(null);
    
    const [status, setStatus] = useState(null); 

    
    useEffect(() => {
        if (certData && certData.qrCodeId) {
            generateQrDataUrl(certData).then(setQrImage);
        }
    }, [certData]);


    if (!certData) return null;


    // ---------------------- PDF Download Handler  ----------------------
    const handleDownloadPDF = async () => {
        setStatus('downloading');

        const element = document.getElementById("cert-preview-area");
        if (!element) {
            setStatus('error');
            return;
        }

        try {
            // Capture high-quality render of the certificate
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.98);

            // Create PDF in real A4 portrait dimension
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

            // Use recipientName from certData
            const fileName = `${certData.recipientName.replace(/\s+/g, "_")}_Certificate_${certData.qrCodeId}.pdf`; 
            pdf.save(fileName);

            setStatus("success");

        } catch (error) {
            console.error("PDF generation failed:", error);
            setStatus("error");
        } finally {
            // Optional: clear status after a few seconds
            setTimeout(() => setStatus(null), 5000);
        }
    };
   


    // ---------------------- Render Section ----------------------
    return (
<div className="fixed inset-0 bg-black/40 z-[99999] p-2 sm:p-4 flex items-center justify-center overflow-auto">        
    <div className={`
                flex flex-col rounded-xl shadow-2xl w-full max-w-4xl 
                bg-white/90  relative border border-gray-100
                max-h-[95vh] h-full
            `}>

                {/* MODAL HEADER / ACTIONS BAR */}
<header className="flex justify-end items-center p-3 sm:p-4 border-b border-gray-100 bg-white/90 rounded-t-xl sticky top-0 z-30">                    <div className="flex items-center gap-4">
                        {/* Status Indicator */}
                        <div className="mr-4 text-sm font-medium">
                            {status === 'downloading' && <span className="flex items-center text-blue-500"><Loader className="w-4 h-4 mr-2 animate-spin" /> Preparing PDF...</span>}
                            {status === 'success' && <span className="flex items-center text-green-500"><CheckCircle className="w-4 h-4 mr-2" /> Download Complete!</span>}
                            {status === 'error' && <span className="flex items-center text-red-500"><AlertTriangle className="w-4 h-4 mr-2" /> Download Failed.</span>}
                        </div>
                        
                        {/* Download Button (Primary Action) */}
                        <button
                            onClick={handleDownloadPDF}
                            disabled={status === 'downloading'}
                            className={`
                                px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold shadow-md transition-all duration-200
                                ${status === 'downloading' 
                                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                                    : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]'
                                }
                            `}
                            title="Download Certificate as PDF"
                        >
                            {status === 'downloading' ? <Loader className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            PDF
                        </button>
                        
                        {/* Close/Back Button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"
                                title="Close Viewer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </header>


                {/* Certificate Preview Area (Scrollable Content) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div id="cert-preview-area" className="w-full mx-auto" style={{ minWidth: '600px', maxWidth: '820px' }}>
                        <div
                            style={{
                                // ... (Your original certificate container styles)
                                position: "relative", width: "100%", minHeight: "820px", padding: "18mm",
                                background: "linear-gradient(135deg, #f0f7ff, #d6e8ff, #b5d4ff, #89bfff)",
                                borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            }}
                        >
                            {/* Borders (Skipping border styles for brevity) */}
                            <div style={{ position: "absolute", inset: "10mm", border: "2px solid #1e3a8a55", borderRadius: "10px", }} />
                            <div style={{ position: "absolute", inset: "12mm", border: "1px solid #1e3a8a33", borderRadius: "8px", }} />

                            {/* CONTENT */}
                            <div style={{ position: "relative", zIndex: 2 }}>
                                {/* Header */}
                                <div style={{ textAlign: "center" }}>
                                    {/* 💡 NOTE: Assuming the prop for logo is certData.logoImage */}
                                    <InstitutionHeader
                                        logo={certData.logoImage} 
                                        name={certData.institutionName}
                                    />
                                    {/* ... Certificate Title ... */}
                                    <h1 style={{ fontSize: "52px", fontWeight: "900", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "6px", }}>
                                        {certData.certificateTitle}
                                    </h1>
                                    <div style={{ width: "160px", height: "4px", margin: "12px auto", background: "linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)", borderRadius: "2px", }} />
                                </div>

                                {/* Body */}
                                <div style={{ textAlign: "center", marginTop: "20px" }}>
                                    <p style={{ fontSize: "20px", color: "#1e3a8a99", fontStyle: "italic", }}>Proudly Presented To</p>
                                    <h2 style={{ fontSize: "46px", fontWeight: "900", color: "#1e3a8a", borderBottom: "4px solid #3b82f6", display: "inline-block", paddingBottom: "5px", }}>
                                        {certData.recipientName}
                                    </h2>
                                    <p style={{ fontSize: "18px", color: "#1e293b", maxWidth: "80%", margin: "20px auto", lineHeight: "1.6", }}>
                                        {certData.certificateDescription}
                                    </p>
                                    <h3 style={{ fontSize: "30px", fontWeight: "800", color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "3px", }}>
                                        {certData.courseName}
                                    </h3>
                                </div>

                                {/* Footer */}
                                <div>
                                    {/* Date */}
                                    <div style={{ textAlign: "center", margin: "25px 0", padding: "15px 0", borderTop: "2px solid #1e3a8a33", borderBottom: "2px solid #1e3a8a33", }}>
                                        <p style={{ fontSize: "14px", color: "#475569", textTransform: "uppercase", }}>Date of Completion</p>
                                        <p style={{ fontSize: "22px", fontWeight: "700", color: "#1e3a8a", }}>
                                            {formatDateForCert(certData.completionDate)}
                                        </p>
                                    </div>

                                    {/* Signature + QR */}
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 30px", }}>
                                        {/* Signature */}
                                        <div style={{ width: "40%", textAlign: "center" }}>
                                            <div style={{ height: "70px", borderBottom: "2px solid #1e3a8a", marginBottom: "8px", }}>
                                                {certData.signatureImage ? (
                                                    <img src={certData.signatureImage} alt="Signature" style={{ maxWidth: "100%", maxHeight: "100%", }} />
                                                ) : (
                                                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>SIGNATURE</span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a8a", }}>
                                                {certData.issuerName}
                                            </p>
                                            <p style={{ fontSize: "13px", color: "#6b7280" }}>
                                                {certData.issuerTitle}
                                            </p>
                                        </div>

                                        {/* QR Code - Using State Variable */}
                                        {qrImage && (
                                            <div style={{ textAlign: "center" }}>
                                                <img
                                                    src={qrImage} // 💡 Now correctly uses the state variable
                                                    alt="QR Code"
                                                    style={{
                                                        width: "105px", height: "105px", background: "white",
                                                        padding: "6px", border: "2px solid #1e3a8a", borderRadius: "6px",
                                                    }}
                                                />
                                                <p style={{ fontSize: "10px", color: "#475569" }}>
                                                    Scan to Verify
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ID */}
                                    <p style={{ textAlign: "center", marginTop: "10px", fontSize: "12px", color: "#475569", }}>
                                        Certificate ID: {certData.qrCodeId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateViewer;