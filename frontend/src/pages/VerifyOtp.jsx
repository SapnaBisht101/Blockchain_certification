// src/pages/VerifyOtp.jsx
import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, Link } from "react-router-dom";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // location.state should contain { email, role }
  const prefillEmail = location.state?.email || "";
  const prefillRole = location.state?.role || "student";

  const [email] = useState(prefillEmail);
  const [role] = useState(prefillRole);
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await axios.post("http://localhost:4000/auth/verify-otp", { email, otp, role });
      setStatus({ type: "success", text: res.data.message || "Verified successfully" });
      // after a short delay, navigate to login
      setTimeout(() => navigate("/login",{replace:true}), 1200);
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.message || "Verification failed" });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="w-screen min-h-screen flex justify-center items-center bg-blue-50 p-6">
      <form onSubmit={handleVerify} className="max-w-md w-full p-8 rounded-2xl bg-white shadow-md border border-blue-400">
        <h2 className="text-2xl text-blue-600 flex gap-4 items-center font-semibold mb-3"><img src="pnglogo.png" alt="" className="h-10 w-10" />Verify your email</h2>
        <p className="text-sm text-gray-600 mb-4">Enter the OTP we sent to <strong>{email || "(no email provided)"}</strong></p>

        {status && (
          <div className={`p-3 mb-4 rounded ${status.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {status.text}
          </div>
        )}

        <label className="block text-sm font-medium text-blue-500 mb-2">OTP</label>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          placeholder="Enter the OTP"
          className="w-full px-4 py-3 rounded-md border border-blue-200 mb-4"
        />

        <button type="submit" disabled={isLoading} className="w-full py-3 rounded-md bg-blue-600 text-white border border-blue-600 hover:bg-white hover:text-blue-600 duration-300 font-semibold">
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>


        <div className="mt-4 text-sm text-center">
          <Link to="/register" className="text-blue-700 hover:underline">Back to Register</Link>
        </div>
      </form>
    </div>
  );
};

export default VerifyOtp;
