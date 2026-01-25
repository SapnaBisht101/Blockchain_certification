import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// --- Theme Constants ---
const TEXT_DARK = "text-gray-900";
const TEXT_MUTED = "text-gray-500";
const BORDER_LIGHT = "border-gray-200";

// Helper for Gradient Text
const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 ${className}`}
  >
    {children}
  </span>
);

// --- Component: Role Selection Tab ---
const RoleTab = ({ currentRole, targetRole, label, setRole, description }) => {
  const isActive = currentRole === targetRole;
  return (
    <button
      type="button"
      onClick={() => setRole(targetRole)}
      className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
        isActive
          ? "bg-white border-gray-200  text-gray-900 transform scale-[1.02]"
          : "bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="font-bold">{label}</span>
        <span className="text-[10px] font-normal opacity-70 hidden sm:block">
          {description}
        </span>
      </div>
    </button>
  );
};

// --- Component: Input Field ---
const InputField = React.memo(
  ({
    name,
    type = "text",
    placeholder,
    required = true,
    value,
    handleChange,
    className = "",
  }) => {
    return (
      <div className={`w-full ${className}`}>
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value || ""}
          onChange={handleChange}
          required={required}
          className={`w-full py-3 px-4 rounded-xl border ${BORDER_LIGHT} bg-gray-50/50 ${TEXT_DARK} placeholder-gray-400 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:bg-white transition duration-300 outline-none`}
        />
      </div>
    );
  }
);

InputField.displayName = "InputField";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- Handlers ---

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    let url = "http://localhost:4000/login/student";
    if (role === "admin") url = "http://localhost:4000/login/admin";
    if (role === "issuerVerifier") url = "http://localhost:4000/login/issuer";

    try {
      const res = await axios.post(url, formData);
      if (res.status === 200) {
        setStatusMessage({ type: "success", text: "✅ Login successful!" });
        const info = res.data.user;
        localStorage.setItem("user", JSON.stringify(info));
        
        // Small delay to show success message before navigation
        setTimeout(() => {
            setFormData({ email: "", password: "" });
            if (role === "student") navigate("/student", { state: info });
            else if (role === "admin") navigate("/admin", { state: info });
            else navigate("/issuer", { state: info });
        }, 800);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "❌ Login failed. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetPassword = () => {
    navigate("/forget")
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#F9FAFB] p-4 font-sans overflow-hidden">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-white p-8 md:p-10 flex flex-col max-h-[95vh]">
        
        {/* Header Section */}
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-3xl font-extrabold tracking-tight mb-1">
            <GradientText>Welcome Back</GradientText>
          </h2>
          <p className={`text-sm ${TEXT_MUTED}`}>
            Sign in to access your portal.
          </p>
        </div>

        {/* Custom Role Selector */}
        <div className="bg-gray-100/80 p-1.5 rounded-2xl flex border border-stone-500 mb-6 shrink-0">
          <RoleTab
            currentRole={role}
            targetRole="student"
            label="Student"
            description="Holder"
            setRole={setRole}
          />
          <RoleTab
            currentRole={role}
            targetRole="issuerVerifier"
            label="Issuer"
            description="Institution"
            setRole={setRole}
          />
          <RoleTab
            currentRole={role}
            targetRole="admin"
            label="Admin"
            description="Manager"
            setRole={setRole}
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 mb-4 rounded-xl text-center text-sm font-medium animate-pulse shrink-0 ${
              statusMessage.type === "error"
                ? "bg-red-50 text-red-600 border border-red-100"
                : statusMessage.type === "success"
                ? "bg-green-50 text-green-600 border border-green-100"
                : "bg-blue-50 text-blue-600 border border-blue-100"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
            <div className="space-y-4">
                <InputField
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    handleChange={handleChange}
                />
                <div className="relative">
                    <InputField
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        handleChange={handleChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pt-3">
                        {/* Could add eye icon here later */}
                    </div>
                </div>
            </div>

            <div className="mt-2 text-right">
                <button
                type="button"
                onClick={handleForgetPassword}
                className={`text-xs font-semibold ${TEXT_MUTED} hover:text-gray-900 transition-colors duration-300`}
                >
                Forgot Password?
                </button>
            </div>

            {/* Action Area */}
            <div className="mt-8 pt-2">
                <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 transition-all duration-300 shadow-xl shadow-gray-900/20 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center`}
                >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                    <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        ></circle>
                        <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    <span>Verifying...</span>
                    </div>
                ) : (
                    "Sign In"
                )}
                </button>

                <div className="mt-6 text-center">
                    <Link
                        to="/register"
                        className={`text-sm font-medium ${TEXT_MUTED} hover:${TEXT_DARK} transition duration-300`}
                    >
                        New to the platform?{" "}
                        <span className="font-bold underline decoration-2 decoration-gray-200 hover:decoration-gray-900">
                        Create account.
                        </span>
                    </Link>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Login;