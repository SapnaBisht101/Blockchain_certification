import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUserDetails } from "../../js/fetch";
import axios from "axios";
import {
  Search,
  Plus,
  LogOut,
  Shield,
  Award,
  FileText,
  Calendar,
  Mail,
  User,
  Building,
  Grid,
  List,
  Eye,
  MoreVertical,
  CheckCircle,
} from "lucide-react";

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Issuer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPending, setShowPending] = useState(false);
  const [issuerProfile, setIssuerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const details = location.state;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (details && details.email) {
          const profileData = await fetchUserDetails("issuer", details.email);
          console.log(profileData);

          setIssuerProfile(profileData);

          const certis = await axios.get(
            `http://localhost:4000/issuer/${details.id}/certificates`
          );
          const certificatesArray = certis.data.data || [];
          console.log(certificatesArray);
          setIssuedCertificates(certificatesArray);
          setTotalCertificates(certificatesArray.length);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [details]);

  const filteredCertificates = issuedCertificates.filter((cert) => {
    const matchesSearch =
      cert.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.courseName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleLogout = () => {
    navigate("/login", { replace: true });
  };

  const handleIssueNew = () => {
    navigate("/issue", { state: issuerProfile });
  };

  const handleVerify = () => {
    navigate("/verify");
  };
  const handlePendingClick = async () => {
    try {
      setShowPending(true);
      setIsLoading(true);

      const res = await axios.get(
        `http://localhost:4000/issuer/request/pending/${details.id}`
      );

      setPendingRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching pending requests");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className=" w-full ml-64 min-h-screen "
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64  border-r border-gray-200 flex flex-col z-20">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center rounded-lg">
              <img src="/pnglogo.png" />
            </div>
            <span className="font-semibold text-xl text-blue-600 tracking-tight">
              DECIVE
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Certificates */}
          <button
            onClick={() => setShowPending(false)}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg
    border border-gray-200 text-gray-700 font-medium
    hover:bg-blue-50 hover:border-blue-400
hover:text-blue-600    transition-all duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              <Award className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left">Certificates</span>
          </button>

          {/* Pending */}
          <button
            onClick={handlePendingClick}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg
    border border-gray-200 text-gray-700 font-medium
    hover:bg-blue-50 hover:border-blue-400
hover:text-blue-600    transition-all duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              <User className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left">Pending Requests</span>
          </button>
          {/* Issue New */}
          <button
            onClick={() => handleIssueNew()}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg
    border border-gray-200 text-gray-700 font-medium
    hover:bg-blue-50 hover:border-blue-400
hover:text-blue-600    transition-all duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              <FileText className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left">Issue New</span>
          </button>

          {/* Verify */}
          <button
            onClick={() => navigate("/verify")}
            className="group w-full flex items-center gap-3 px-4 py-3 rounded-lg
    border border-gray-200 text-gray-700 font-medium
    hover:bg-blue-50 hover:border-blue-400
hover:text-blue-600    transition-all duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              <User className="w-5 h-5" />
            </div>
            <span className="flex-1 text-left">Verify</span>
          </button>
        </nav>

        {/* Profile & Logout */}
        <div className="p-4 ">
          {issuerProfile && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-blue-500 rounded-lg">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                {issuerProfile.issuerName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold px-2 text-white truncate">
                  {issuerProfile.issuerName}
                </p>
                <p className="text-xs text-black border border-blue-900 rounded-sm inline px-2 py-1 truncate">
                  {issuerProfile.issuerTitle}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full border border-red-400 flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className=" w-full">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-100 border border-blue-400 rounded-xl  transition-all text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-6">
              <button
                onClick={handleVerify}
                className="px-4 py-2.5 text-gray-600 hover:bg-blue-100 hover:border-blue-400 hover:text-blue-600 rounded-xl font-medium transition-all text-sm border border-gray-200"
              >
                Verify Certificate
              </button>
              <button
                onClick={handleIssueNew}
                className="flex border border-white items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-white hover:border-blue-600 hover:text-blue-600 rounded-xl font-medium transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Issue Certificate
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          {/* Institution Info Card */}
          {issuerProfile && (
            <div className="rounded-3xl p-4  mb-8 relative overflow-hidden  border-dashed border border-blue-600">
              <div className="relative flex items-start justify-between gap-4 h-40">
                {/* --- REDESIGNED ISSUER PROFILE BOX --- */}
                <div className="flex-1 h-full flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-tr to-blue-500 from-blue-800 overflow-hidden relative ">
                  {/* Logo Container */}
                  <div className="h-20 w-20 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-2 flex items-center justify-center shrink-0 shadow-sm">
                    {issuerProfile.institutionLogo ? (
                      <img
                        src={issuerProfile.institutionLogo}
                        alt="Logo"
                        className="h-full w-full object-contain drop-shadow-sm"
                      />
                    ) : (
                      <Building className="w-10 h-10 text-zinc-300" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col justify-center space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                      {issuerProfile.institutionName}
                    </h2>
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                      {issuerProfile.issuerTitle}
                    </p>

                    <div className="pt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <User className="w-4 h-4" />
                        <span className="text-zinc-300 font-medium">
                          {issuerProfile.issuerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Mail className="w-4 h-4" />
                        <span className="text-zinc-400 truncate">
                          {issuerProfile.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- RIGHT SIDE STATS BOXES --- */}
                <div className="flex gap-4 shrink-0">
                  {/* Total Box - Refined Dark Theme */}
                  <div className="bg-white justify-between border-4 border-blue-700 flex flex-col text-blue-600 rounded-3xl w-40 h-40 shadow-lg">
                    <div className="flex items-center justify-center   p-3 bg-blue-700 rounded-t-2xl">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                    <p className="text-4xl font-bold  justify-center bg items-center flex flex-1 tracking-tight text-blue-600">
                      {totalCertificates}
                    </p>
                    <p className="text-xs justify-center flex p-3 text-white bg-blue-500 rounded-b-2xl font-medium">
                      Certificates Issued
                    </p>
                  </div>
                  {/* This Month Box - Converted to Dark Theme for Consistency */}
                  <div className="bg-white justify-between border-4 border-blue-500 flex flex-col text-blue-600 rounded-3xl w-40 h-40 shadow-lg">
                    <div className="flex items-center justify-center   p-3 bg-blue-700 rounded-t-2xl">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">
                        This Month
                      </span>
                    </div>
                    <p className="text-4xl font-bold  justify-center bg items-center flex flex-1 tracking-tight text-blue-600">
                      {
                        issuedCertificates.filter((c) => {
                          const certDate = new Date(c.issuedAt);
                          const now = new Date();
                          return (
                            certDate.getMonth() === now.getMonth() &&
                            certDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </p>
                    <p className="text-xs justify-center flex p-3 text-white bg-blue-500 rounded-b-2xl font-medium">
                      Recently Issued
                    </p>
                  </div>
                  {/* pending requests box  */}
                  <div className="bg-white justify-between border-4 border-blue-700 flex flex-col text-blue-600 rounded-3xl w-40 h-40 shadow-lg">
                    <div className="flex items-center justify-center   p-3 bg-blue-700 rounded-t-2xl">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">
                        Pending
                      </span>
                    </div>
                    <p className="text-4xl font-bold  justify-center bg items-center flex flex-1 tracking-tight text-blue-600">
                      {pendingRequests.length}
                    </p>
                    <p className="text-xs justify-center flex p-3 text-white bg-blue-500 rounded-b-2xl font-medium">
                      Requests
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Certificates Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-blue-600 mb-1">
                {showPending ? "Pending Requests" : "Issued Certificates"}
              </h2>
              <p className="text-gray-600 text-sm">
                {showPending
                  ? `${pendingRequests.length} pending request(s)`
                  : `${filteredCertificates.length} certificate(s) found`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading certificates...</p>
            </div>
          )}

          {/* Certificates Grid View */}
          {!isLoading && !showPending && viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert._id}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all duration-300"
                >
                  {/* Top Accent */}
                  <div className="h-3 bg-blue-500"></div>

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                          {cert.recipientName?.charAt(0)}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-black">
                            {cert.recipientName}
                          </h3>

                          <p className="text-xs text-gray-500">
                            {formatDate(cert.issuedAt)}
                          </p>
                        </div>
                      </div>

                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Course */}
                    <div className="mb-5">
                      <p className="text-sm text-gray-600 mb-1">Course</p>

                      <p className="font-medium text-gray-900 line-clamp-2">
                        {cert.courseName}
                      </p>
                    </div>

                    {/* Certificate ID */}
                    <div className="flex items-center justify-between mb-6 text-xs text-gray-500">
                      <span>ID</span>

                      <span className="font-mono text-gray-700">
                        {cert._id?.slice(-8)}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>

                      <button
                        onClick={() =>
                          navigate(`/view-certificate`, { state: { cert } })
                        }
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {!isLoading && !showPending && viewMode === "list" && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Date Issued
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCertificates.map((cert) => (
                    <tr
                      key={cert._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {cert.recipientName?.charAt(0)}
                          </div>
                          <span className="font-semibold text-black">
                            {cert.recipientName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{cert.courseName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(cert.issuedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-600">
                          {cert._id?.slice(-8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() =>
                            navigate(`/view-certificate`, { state: { cert } })
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 border border-blue-500 hover:bg-white hover:text-blue-500 text-white  rounded-lg text-sm font-medium transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !showPending && filteredCertificates.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">
                No certificates found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by issuing your first certificate"}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleIssueNew}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-gray-800 rounded-xl font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Issue First Certificate
                </button>
              )}
            </div>
          )}

          {!isLoading && showPending && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">
                  Pending Certificate Requests
                </h2>

                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {pendingRequests.length} Requests
                </span>
              </div>

              {/* Content */}
              <div className="divide-y divide-gray-100">
                {pendingRequests.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    No pending requests
                  </div>
                ) : (
                  pendingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition"
                    >
                      {/* Left Side */}
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {req.studentId?.name?.charAt(0)}
                        </div>

                        {/* Info */}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {req.studentId?.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {req.studentId?.email}
                          </p>

                          <p className="text-sm text-gray-600 mt-1">
                            {req.message}
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => {
                          navigate("/issue", {
                            state: {
                              ...issuerProfile,
                              studentEmail: req.studentId?.email,
                              remove_request: req._id,
                            },
                          });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        Issue Certificate
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Issuer;
