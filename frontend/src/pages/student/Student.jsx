import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import RequestModal from "./RequestModel";
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
} from "lucide-react";

const API_BASE_URL = "http://localhost:4000";

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const sortCertificates = (certs) => {
  return certs.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
};
const CertificateListItem = ({ cert, onClick }) => (
  <div
    onClick={() => onClick(cert)}
    className="group overflow-hidden relative bg-white p-4 rounded-xl border border-gray-200 cursor-pointer transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md flex justify-between items-center"
  >

    {/* left glow bar */}
    <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition"></div>

    <div className="flex-1 min-w-0 flex items-center gap-4">

      {/* icon */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center transition group-hover:bg-blue-100">
        <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition" />
      </div>

      {/* text */}
      <div>
        <p className="text-base font-semibold text-gray-900 truncate">
          {cert.courseName}
        </p>

        <div className="flex items-center text-sm text-gray-500 mt-0.5 space-x-4">

          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition" />
            <span>{formatDate(cert.issuedAt)}</span>
          </span>

          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition" />
            <span className="font-medium">
              {cert.institutionName}
            </span>
          </span>

        </div>
      </div>
    </div>

    {/* right arrow */}
    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />

  </div>
);
const CertificateGridItem = ({ cert, onClick }) => (
  <div
    onClick={() => onClick(cert)}
    className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-blue-100 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-200/40 transform"
  >
    
    {/* top gradient glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-500"></div>

    <div className="relative flex flex-col h-full">

      {/* icon */}
      <div className="flex justify-between items-start mb-5">
   
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center transition group-hover:bg-blue-100">
        <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition" />
      </div>

        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
          Certificate
        </span>
      </div>

      {/* content */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
          {cert.courseName}
        </h3>

        {cert.recipientName && (
          <p className="text-sm text-gray-500 mb-2">
            Awarded to{" "}
            <span className="font-semibold text-gray-700">
              {cert.recipientName}
            </span>
          </p>
        )}

        <p className="text-sm text-gray-600 line-clamp-2">
          {cert.certificateDescription}
        </p>
      </div>

      {/* footer */}
      <div className="mt-6 pt-4 border-t border-blue-100 flex justify-between items-center">

        <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
          <Calendar className="w-3 h-3 text-blue-500" />
          {formatDate(cert.issuedAt)}
        </span>

        <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition">
          View →
        </span>

      </div>
    </div>
  </div>
);

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
    }
  );

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestpage, setrequestpage] = useState(false);
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
          `${API_BASE_URL}/student/certificates/${studentInfo.id}`
        );

        const fetched = res.data.certificates || [];
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <Loader className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-xl font-medium text-gray-700">
          Loading credentials...
        </p>
      </div>
    );

  const PrimaryButton = ({ children, onClick, icon: Icon }) => (
    <button
      onClick={onClick}
      className="px-4 py-2 flex items-center gap-2 bg-[#175ffc] text-white rounded-lg text-sm font-semibold shadow hover:bg-blue-700 active:scale-[0.97] transition"
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );

  const ToggleButton = ({ active, icon: Icon, onClick }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition ${
        active
          ? "bg-blue-100 text-[#175ffc]"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100">

      <header className="bg-white/80 backdrop-blur-xl border-b border-blue-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="pnglogo.png" className="w-12 h-12 text-[#175ffc]" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {student.name}
              </h1>
              <p className="text-gray-500 text-xs">{student.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <PrimaryButton onClick={handleRequest} icon={Plus}>
              New Request
            </PrimaryButton>

            <PrimaryButton onClick={handleLogout} icon={LogOut}>
              Sign Out
            </PrimaryButton>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            My Credentials ({certificates.length})
          </h2>

          <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-blue-100 shadow-sm">
            <ToggleButton
              active={viewMode === "list"}
              icon={List}
              onClick={() => setViewMode("list")}
            />

            <ToggleButton
              active={viewMode === "grid"}
              icon={Grid}
              onClick={() => setViewMode("grid")}
            />
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-white p-14 rounded-2xl border border-blue-100 shadow-lg text-center">
            <p className="text-gray-600 text-lg font-medium">
              No credentials found.
            </p>
          </div>
        ) : (
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
                  onClick={() =>
                    navigate(`/view-certificate`, { state: { cert } })
                  }
                />
              ) : (
                <CertificateGridItem
                  key={cert._id}
                  cert={cert}
                  onClick={() =>
                    navigate(`/view-certificate`, { state: { cert } })
                  }
                />
              )
            )}
          </div>
        )}
      </main>

      {requestpage && (
        <RequestModal
          show={requestpage}
          onClose={() => setrequestpage(false)}
          studentId={student.id}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
};

export default StudentPage;

