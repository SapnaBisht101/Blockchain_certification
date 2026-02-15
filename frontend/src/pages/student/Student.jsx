import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import RequestModal from "./RequestModel";

import CertificateViewer from "./CertificateViewer";
import {
  GraduationCap,
  LogOut,
  Plus,
  Briefcase,
  Calendar,
  FileText,
  ChevronRight,
  Loader,
  List,
  Grid,
  Zap, // Added List and Grid icons
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000";

// --- Utility Functions ---
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const sortCertificates = (certs) => {
  // Sorts by issuedAt descending (most recent first)
  return certs.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
};

// --- Certificate Card Components ---

// 1. List View Item (Compact, High-Density)
const CertificateListItem = ({ cert, onClick }) => (
  <div
    onClick={() => onClick(cert)}
    className={`
            group bg-white p-4 rounded-xl shadow-lg border-l-4 border-l-indigo-600/70 // Highlight accent border
            border-t border-r border-b border-gray-100 cursor-pointer 
            transition-all duration-300 ease-in-out
            hover:shadow-xl hover:border-l-indigo-700 hover:bg-indigo-50/50 // Hover effect
            flex justify-between items-center
        `}
  >
    {/* Left Side: Course & Details */}
    <div className="flex-1 min-w-0 flex items-center gap-4">
      {/* Icon - Prominent Blue Background */}
      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
        <FileText className="w-5 h-5 text-white" />
      </div>

      {/* Text Content */}
      <div>
        {/* Course Name - Bold and Dark */}
        <p className="text-base font-semibold text-indigo-900 truncate">
          {cert.courseName}
        </p>

        {/* Metadata - Lighter and Structured */}
        <div className="flex items-center text-sm text-gray-500 mt-0.5 space-x-4">
          {/* Date */}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span className="text-gray-600">{formatDate(cert.issuedAt)}</span>
          </span>
          {/* Institution */}
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-indigo-400" />
            <span className="font-medium text-gray-700">
              {cert.institutionName}
            </span>
          </span>
        </div>
      </div>
    </div>

    {/* Right Side: Action Icon */}
    <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 group-hover:text-indigo-800 transition transform group-hover:translate-x-0.5" />
  </div>
);

// 2. Grid View Item (Visual, Card-Style)
const CertificateGridItem = ({ cert, onClick }) => (
  <div
    onClick={() => onClick(cert)}
    className={`
            group relative bg-white p-6 rounded-2xl shadow-xl 
            cursor-pointer 
            transition-all duration-300 ease-out border border-white
            hover:shadow-2xl hover:border-black transform hover:scale-[1.03]
            flex flex-col justify-between h-full overflow-hidden
        `}
  >
    {/* Certificate Ribbon/Seal Accent (Top Right) */}
    <div className="absolute top-0 right-0 w-0 h-0 border-t-[50px] border-l-[50px] border-t-amber-400/80 border-l-transparent" />
    <div className="absolute top-0 right-0 w-0 h-0 border-t-[55px] border-l-[55px] border-t-indigo-900 border-l-transparent opacity-10" />

    <div className="flex justify-between items-start mb-4 relative z-10">
      {/* Logo/Icon Area - Changed to a Gold/Dark Accent */}
      <div className="w-12 h-12 rounded-xl bg-amber-500/80 flex items-center justify-center flex-shrink-0 border-2 border-amber-600 shadow-inner">
        <FileText className="w-5 h-5 text-indigo-900" />
      </div>
      {/* Institution Name */}
      <p className="text-sm font-medium text-indigo-800 mt-1">
        {cert.institutionName}
      </p>
    </div>

    <div className="flex-1 relative z-10">
      {/* Course Name - Prominent and Bold */}
      <h3 className="text-xl font-extrabold text-indigo-900 mb-2 truncate">
        {cert.courseName}
      </h3>
      {/* Recipient Name (Added for context) */}
      {cert.recipientName && (
        <p className="text-sm text-gray-500 italic mb-2">
          Awarded to:{" "}
          <span className="font-semibold text-gray-700">
            {cert.recipientName}
          </span>
        </p>
      )}
      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2">
        {cert.certificateDescription}
      </p>
    </div>

    {/* Footer - Date and CTA */}
    <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-between items-center relative z-10">
      <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
        <Calendar className="w-3 h-3 text-indigo-400" />
        Completed:{" "}
        <span className="text-gray-700 font-semibold">
          {formatDate(cert.issuedAt)}
        </span>
      </span>
      <span className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
        View Details
        <ChevronRight className="w-4 h-4 ml-1 transition group-hover:translate-x-0.5" />
      </span>
    </div>
  </div>
);

// --- StudentPage Component ---
const StudentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentInfo = location.state;

  const [student] = useState(
    studentInfo || {
      name: "User",
      email: "loading...",
      id: "...",
      role: "Student",
    },
  );
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestpage, setrequestpage] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  // New state for view mode: 'list' or 'grid'
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    if (!studentInfo || !studentInfo.id) {
      navigate("/login", { replace: true });
      return;
    }

    const loadCertificates = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/student/certificates/${studentInfo.id}`,
        );
        console.log(res);

        const fetched = res.data.certificates || [];
        // Certificates are sorted immediately upon fetching
        setCertificates(sortCertificates(fetched));
      } catch (err) {
        console.error("Certificate load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [navigate, studentInfo]);

  const handleLogout = () => {
    navigate("/login", { replace: true });
  };

  const handleRequest = () => {
    setrequestpage(true);
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-5">
        <Loader className="w-8 h-8 text-gray-500 animate-spin mb-3" />
        <p className="text-xl font-medium text-gray-700">
          Loading credentials...
        </p>
      </div>
    );

  // --- Primary Button Component (High-contrast actions) ---
  const PrimaryButton = ({ children, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`
                px-4 py-2 flex items-center justify-center gap-2
                bg-gray-900 text-white rounded-lg text-sm font-medium
                shadow-md transition-all duration-200 ease-in-out
                hover:bg-gray-700 active:scale-[0.98]
            `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  // --- Toggle Button Component ---
  const ToggleButton = ({ active, icon: Icon, onClick, label }) => (
    <button
      onClick={onClick}
      title={label}
      className={`
                p-2 rounded-lg transition-colors duration-200
                ${
                  active
                    ? "bg-gray-200 text-gray-800"
                    : "text-gray-500 hover:bg-gray-100"
                }
            `}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    // --- Main Container with Light Background Effect ---
    <div className="relative min-h-screen w-full overflow-hidden text-gray-900">
      {/* --- Fixed Background Effects (Subtle Gray/White Circles) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-gray-200/50 rounded-full blur-3xl opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] bg-white/50 rounded-full blur-3xl opacity-40 animate-pulse-slow-reverse" />
      </div>

      {/* --- Content Overlay (z-10) --- */}
      <div className="relative z-10">
        {/* HEADER (Frosted Glass Effect) */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GraduationCap className="w-7 h-7 text-gray-700" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">
                  {student.name}
                </h1>
                <p className="text-gray-500 text-xs">{student.email}</p>
              </div>
            </div>

            <div className="flex gap-1"><PrimaryButton onClick={handleRequest} icon={Plus}>
              New Request
            </PrimaryButton>
            <PrimaryButton onClick={handleLogout} icon={LogOut}>
              Sign Out
            </PrimaryButton></div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          {/* Header with View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-800">
              My Credentials ({certificates.length})
            </h2>

            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <ToggleButton
                active={viewMode === "list"}
                icon={List}
                onClick={() => setViewMode("list")}
                label="List View"
              />
              <ToggleButton
                active={viewMode === "grid"}
                icon={Grid}
                onClick={() => setViewMode("grid")}
                label="Grid View"
              />
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-md text-center">
              <p className="text-gray-500 text-lg">
                No official credentials found in your account.
              </p>
            </div>
          ) : (
            // Conditional Rendering based on viewMode
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-3"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              }
            >
              {certificates.map((cert) =>
                viewMode === "list" ? (
                  <CertificateListItem
                    key={cert._id}
                    cert={cert}
                    onClick={setSelectedCertificate}
                  />
                ) : (
                  <CertificateGridItem
                    key={cert._id}
                    cert={cert}
                    onClick={setSelectedCertificate}
                  />
                ),
              )}
            </div>
          )}
        </main>
      </div>

      {/* CERTIFICATE VIEWER MODAL */}
      <CertificateViewer
        certData={selectedCertificate}
        qrCodeId={selectedCertificate?.qrCodeId}
        qrCodeImage={selectedCertificate?.qrImage}
        onClose={() => setSelectedCertificate(null)}
      />

      {requestpage && (
        <RequestModal
          show={requestpage}
          onClose={() => setrequestpage(false)}
          studentId={student.id}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {/* CSS for subtle animation on the background circles */}
      <style jsx="true">{`
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.05) translate(30px, -30px);
          }
        }
        @keyframes pulse-slow-reverse {
          0%,
          100% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.05) translate(-30px, 30px);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 25s infinite alternate;
        }
        .animate-pulse-slow-reverse {
          animation: pulse-slow-reverse 25s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default StudentPage;
