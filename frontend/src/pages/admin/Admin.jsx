import React, { useEffect, useState } from "react";
import { 
  Shield, LogOut, Users, Clock, CheckCircle, XCircle, 
  Trash2, UserCheck, AlertCircle, Loader 
} from "lucide-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router";

const Admin = () => {

  const location  = useLocation();
  const navigate = useNavigate();
  const info = location.state;
  
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Redirect if direct access
  useEffect(() => {
    if (!info) {
      navigate("/login", { replace: true });
    }
  }, [info, navigate]);

  // Fetch latest admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:4000/admin/details/${info.email}`);
      console.log("Admin data loaded:", res.data);
      setAdminData(res.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!info?.email) return;
    loadAdminData();
  }, [info]);

  // Approve / Reject faculty
  const handleVerification = async (facultyId, action) => {
    setActionLoading(facultyId);
    
    try {
      const res = await axios.post(
        `http://localhost:4000/admin/verify/${facultyId}`,
        { action }
      );

      console.log(`Faculty ${action}d:`, res.data);

      if (action === "approve") {
        const approvedFaculty = adminData.pendingRequests.find(
          (f) => f._id === facultyId
        );

        setAdminData((prev) => ({
          ...prev,
          approvedFaculties: [...prev.approvedFaculties, { ...approvedFaculty, approvedAt: new Date().toISOString() }],
          pendingRequests: prev.pendingRequests.filter((f) => f._id !== facultyId),
        }));
      }

      if (action === "reject") {
        setAdminData((prev) => ({
          ...prev,
          pendingRequests: prev.pendingRequests.filter((f) => f._id !== facultyId),
        }));
      }

    } catch (err) {
      console.error("Verification error:", err);
      alert(`Failed to ${action} faculty. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove approved faculty
  const handleRemoveFaculty = async (facultyId) => {
    if (!window.confirm("Are you sure you want to remove this faculty member? This action cannot be undone.")) {
      return;
    }

    setActionLoading(facultyId);
    
    try {
      // Call the reject API to remove the faculty
      const res = await axios.post(
        `http://localhost:4000/admin/verify/${facultyId}`,
        { action: "reject" }
      );

      console.log("Faculty removed:", res.data);

      setAdminData(prev => ({
        ...prev,
        approvedFaculties: prev.approvedFaculties.filter(f => f._id !== facultyId),
      }));

    } catch (err) {
      console.error("Remove faculty error:", err);
      alert("Failed to remove faculty. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 ">
        <Loader className="w-12 h-12 text-gray-800 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-600 text-xl font-semibold">No Data Found</p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen  w-full bg-gradient-to-b from-white via-gray-50 to-gray-100">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{adminData.name}</h1>
                <p className="text-sm text-gray-500">{adminData.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl grid-cols-2 grid gap-4 mx-auto px-6 sm:px-8 py-10 space-y-8">
    
        {/* Pending Requests Section */}
        <section className=" bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Pending Verification</h2>
            </div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
              {adminData.pendingRequests?.length || 0} Requests
            </span>
          </div>

          <div className="p-6">
            {!adminData.pendingRequests || adminData.pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No pending requests</p>
                <p className="text-gray-400 text-sm mt-1">All faculty verifications are up to date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminData.pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="group relative bg-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:border-gray-900 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {req.issuerName || req.name}
                            </h3>
                            <p className="text-sm text-gray-600">{req.email}</p>
                          </div>
                        </div>
                        {req.institutionName && (
                          <p className="text-sm text-gray-500 ml-13">
                            Institution: <span className="font-medium text-gray-700">{req.institutionName}</span>
                          </p>
                        )}
                        {req.issuerTitle && (
                          <p className="text-sm text-gray-500 ml-13">
                            Title: <span className="font-medium text-gray-700">{req.issuerTitle}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleVerification(req._id, "approve")}
                          disabled={actionLoading === req._id}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === req._id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>

                        <button
                          onClick={() => handleVerification(req._id, "reject")}
                          disabled={actionLoading === req._id}
                          className="px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === req._id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Approved Faculties Section */}
        <section className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
          <div className="bg-gray-50 border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex  items-center gap-3">
              <UserCheck className="w-6 h-6 text-gray-900" />
              <h2 className="text-xl font-bold text-gray-900">Approved Faculties</h2>
            </div>
            <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-sm font-semibold">
              {adminData.approvedFaculties?.length || 0} Members
            </span>
          </div>

          <div className="p-6">
            {!adminData.approvedFaculties || adminData.approvedFaculties.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No approved faculties</p>
                <p className="text-gray-400 text-sm mt-1">Approved members will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {adminData.approvedFaculties.map((faculty) => (
                  <div
                    key={faculty._id}
                    className="group relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-5 hover:border-gray-900 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900 leading-tight">
                              {faculty.issuerName || faculty.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-0.5">{faculty.email}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mt-3 text-xs">
                          {faculty.institutionName && (
                            <p className="text-gray-600">
                              <span className="font-semibold text-gray-900">Institution:</span> {faculty.institutionName}
                            </p>
                          )}
                          {faculty.issuerTitle && (
                            <p className="text-gray-600">
                              <span className="font-semibold text-gray-900">Title:</span> {faculty.issuerTitle}
                            </p>
                          )}
                          {faculty.approvedAt && (
                            <p className="text-gray-500">
                              Approved: {new Date(faculty.approvedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFaculty(faculty._id)}
                        disabled={actionLoading === faculty._id}
                        className="flex-shrink-0 p-2 bg-white border-2 border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all group-hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove faculty"
                      >
                        {actionLoading === faculty._id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default Admin;