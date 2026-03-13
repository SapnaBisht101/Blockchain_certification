import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

// --- Theme Constants ---
const TEXT_DARK = "text-blue-700";
const TEXT_MUTED = "text-gray-500";
const BORDER_LIGHT = "border-blue-200";

// Helper for Gradient Text
const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 ${className}`}
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
      className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all duration-300  ${
        isActive
          ? "bg-blue-600  text-white transform scale-[1.02]"
          : "bg-transparent  text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
          className={`w-full py-3 px-4 rounded-xl   bg-blue-50/50 ${TEXT_DARK} placeholder-gray-400 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white transition duration-300 outline-none`}
        />
      </div>
    );
  },
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
        text:
          err.response?.data?.message ||
          "❌ Login failed. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetPassword = () => {
    navigate("/forget");
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#F9FAFB] p-4 font-sans overflow-hidden">
      {/* Card Container: max-w badha di aur flex-row add kiya image include karne ke liye */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-blue-300  flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
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
          <div className="bg-white p-1.5 rounded-2xl flex gap-1 border border-blue-300 mb-6 shrink-0">
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
              <InputField
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                handleChange={handleChange}
              />
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleForgetPassword}
                className={`text-xs font-semibold ${TEXT_MUTED} hover:text-blue-600 hover:underline transition-colors duration-300`}
              >
                Forgot Password?
              </button>
            </div>

            <div className="mt-8 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 border-2 border-blue-600 hover:bg-white hover:text-blue-600 rounded-xl bg-blue-600 text-white font-bold text-lg transition-all duration-300 transform disabled:opacity-70 flex justify-center items-center"
              >
                {isLoading ? "Verifying..." : "Sign In"}
              </button>

              <div className="mt-6 text-center">
                <Link
                  to="/register"
                  className={`text-sm text-gray-500 font-medium transition duration-300`}
                >
                  New to the platform?{" "}
                  <span className="font-bold  hover:text-blue-600">
                    {" "}
                    Create account
                  </span>
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Adjusted Image Section: Card ke andar, right side par */}
        <div className="hidden md:flex md:w-1/2 bg-gray-50 items-center justify-center p-8 border-l border-gray-100">
          <img
            src="/hero_image.png"
            alt="login image"
            className="w-full max-w-[350px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
