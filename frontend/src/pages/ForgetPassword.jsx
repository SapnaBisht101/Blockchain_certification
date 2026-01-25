import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ForgetPassword = () => {
  const [step, setStep] = useState(1); // Step 1 = send OTP, Step 2 = reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("http://localhost:4000/changepassword/forgot-password", { email });
      alert("OTP sent to your email.");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.msg || "Error sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("http://localhost:4000/changepassword/reset-password", {
        email,
        otp,
        newPassword,
      });
      alert("Password reset successfully.");
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.msg || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden relative bg-gray-100">

      {/* -------- Background Gradient Animation -------- */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-gray-900 to-gray-600 opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-gray-700 to-gray-400 opacity-20 blur-3xl animate-pulse"></div>
      </div>

      {/* -------- Card -------- */}
      <div className="backdrop-blur-xl bg-white/40 border border-white/30 shadow-2xl p-10 rounded-3xl w-full max-w-md">

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-900 mb-1 text-center">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h2>

        <p className="text-gray-600 text-center mb-8">
          {step === 1
            ? "Enter your email to receive the OTP"
            : "Enter the OTP sent to your email"}
        </p>

        {/* ------------------- STEP 1: SEND OTP ------------------- */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">

            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-gray-800 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition duration-300 shadow-md disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            <div className="text-center mt-2">
              <Link to="/login" className="text-gray-700 hover:underline">
                Back to Login
              </Link>
            </div>

          </form>
        )}

        {/* ------------------- STEP 2: RESET PASSWORD ------------------- */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">

            <input
              type="text"
              required
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-gray-800 outline-none"
            />

            <input
              type="password"
              required
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-gray-800 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition duration-300 shadow-md disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center mt-2">
              <Link to="/login" className="text-gray-700 hover:underline">
                Back to Login
              </Link>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default ForgetPassword;
