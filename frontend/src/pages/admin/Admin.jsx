import React, { useEffect, useState } from "react";
import {
  Shield, LogOut, Users, Clock, CheckCircle, XCircle,
  Trash2, UserCheck, AlertCircle, Loader
} from "lucide-react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router";

const Admin = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const info = location.state;

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!info) {
      navigate("/login", { replace: true });
    }
  }, [info, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:4000/admin/details/${info.email}`);
      setAdminData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!info?.email) return;
    loadAdminData();
  }, [info]);

  const handleVerification = async (facultyId, action) => {

    setActionLoading(facultyId);

    try {

      await axios.post(
        `http://localhost:4000/admin/verify/${facultyId}`,
        { action }
      );

      if (action === "approve") {

        const approvedFaculty = adminData.pendingRequests.find(
          (f) => f._id === facultyId
        );

        setAdminData(prev => ({
          ...prev,
          approvedFaculties: [
            ...prev.approvedFaculties,
            { ...approvedFaculty, approvedAt: new Date().toISOString() }
          ],
          pendingRequests: prev.pendingRequests.filter(f => f._id !== facultyId)
        }));

      }

      if (action === "reject") {

        setAdminData(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests.filter(f => f._id !== facultyId)
        }));

      }

    } catch (err) {
      alert("Action failed");
    } finally {
      setActionLoading(null);
    }

  };

  const handleRemoveFaculty = async (facultyId) => {

    if (!window.confirm("Remove this faculty?")) return;

    setActionLoading(facultyId);

    try {

      await axios.post(
        `http://localhost:4000/admin/verify/${facultyId}`,
        { action: "reject" }
      );

      setAdminData(prev => ({
        ...prev,
        approvedFaculties: prev.approvedFaculties.filter(
          f => f._id !== facultyId
        )
      }));

    } catch (err) {
      alert("Failed to remove");
    } finally {
      setActionLoading(null);
    }

  };

  const handleLogout = () => {
    navigate("/login", { replace: true });
  };

  if (loading) {

    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-50">
        <Loader className="w-10 h-10 animate-spin text-blue-600 mb-4"/>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );

  }

  if (!adminData) {

    return (
      <div className="h-screen flex flex-col justify-center items-center bg-gray-50">

        <AlertCircle className="w-14 h-14 text-red-500 mb-4"/>

        <p className="text-red-600 text-lg font-semibold">
          No Data Found
        </p>

        <button
          onClick={() => navigate("/login")}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Login
        </button>

      </div>
    );

  }

  return (

<div className="min-h-screen bg-gray-50 w-full">

{/* HEADER */}

<header className="py-4 border-b border-gray-200 bg-white sticky top-0 z-20">

<div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

<div className="flex items-center gap-3">

<div className="w-11 h-11 flex items-center justify-center rounded-lg">
<img src="/pnglogo.png"/>
</div>

<span className="font-semibold text-blue-600 text-xl tracking-tight">
DECIVE Admin Panel
</span>

</div>

<div className="flex items-center gap-4">

<div className="text-right hidden md:block">
<p className="font-semibold text-gray-900">{adminData.name}</p>
<p className="text-xs text-gray-500">{adminData.email}</p>
</div>

<button
onClick={handleLogout}
className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-md hover:bg-gray-100"
>
<LogOut size={16}/>
Logout
</button>

</div>

</div>

</header>

{/* MAIN */}

<main className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8">

{/* PENDING */}

<section className="bg-white border border-gray-200 rounded-xl">

<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">

<div className="flex items-center gap-2">

<Clock className="text-blue-600"/>

<h2 className="font-semibold text-gray-900">
Pending Verification
</h2>

</div>

<span className="text-sm text-gray-500">
{adminData.pendingRequests?.length || 0}
</span>

</div>

<div className="p-6 space-y-4">

{adminData.pendingRequests?.length === 0 && (
<p className="text-gray-500 text-sm">
No pending requests
</p>
)}

{adminData.pendingRequests?.map(req => (

<div
key={req._id}
className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
>

<div className="flex justify-between items-start">

<div>

<p className="font-medium text-gray-900">
{req.issuerName || req.name}
</p>

<p className="text-sm text-gray-500">
{req.email}
</p>

{req.institutionName && (
<p className="text-xs text-gray-500 mt-1">
Institution: {req.institutionName}
</p>
)}

</div>

<div className="flex gap-2">

<button
onClick={() => handleVerification(req._id,"approve")}
disabled={actionLoading === req._id}
className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
>

{actionLoading === req._id ?
<Loader className="w-4 h-4 animate-spin"/> :
<CheckCircle size={16}/>
}

Approve

</button>

<button
onClick={() => handleVerification(req._id,"reject")}
disabled={actionLoading === req._id}
className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 flex items-center gap-1"
>

{actionLoading === req._id ?
<Loader className="w-4 h-4 animate-spin"/> :
<XCircle size={16}/>
}

Reject

</button>

</div>

</div>

</div>

))}

</div>

</section>


{/* APPROVED */}

<section className="bg-white border border-gray-200 rounded-xl">

<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">

<div className="flex items-center gap-2">

<UserCheck className="text-blue-600"/>

<h2 className="font-semibold text-gray-900">
Approved Faculties
</h2>

</div>

<span className="text-sm text-gray-500">
{adminData.approvedFaculties?.length || 0}
</span>

</div>

<div className="p-6 space-y-4">

{adminData.approvedFaculties?.length === 0 && (
<p className="text-gray-500 text-sm">
No approved faculties
</p>
)}

{adminData.approvedFaculties?.map(faculty => (

<div
key={faculty._id}
className="border border-gray-200 rounded-lg p-4 flex justify-between items-start hover:border-blue-300 transition"
>

<div>

<p className="font-medium text-gray-900">
{faculty.issuerName || faculty.name}
</p>

<p className="text-sm text-gray-500">
{faculty.email}
</p>

{faculty.approvedAt && (
<p className="text-xs text-gray-400 mt-1">
Approved {new Date(faculty.approvedAt).toLocaleDateString()}
</p>
)}

</div>

<button
onClick={() => handleRemoveFaculty(faculty._id)}
disabled={actionLoading === faculty._id}
className="p-2 border border-gray-200 rounded-md hover:bg-red-50 hover:border-red-400"
>

{actionLoading === faculty._id ?
<Loader className="w-4 h-4 animate-spin"/> :
<Trash2 className="w-4 h-4 text-red-500"/>
}

</button>

</div>

))}

</div>

</section>

</main>

</div>

  );

};

export default Admin;