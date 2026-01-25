import React, { useState, useCallback, useMemo } from "react";
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
      className={`flex-1 py-3 px-2 w-30 rounded-xl text-sm font-medium transition-all  duration-300 border ${
        isActive
          ? "bg-white border-white text-gray-900 transform scale-[1.02]"
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
    isFile = false,
    label = null,
    value,
    handleChange,
    handleFileChange,
    className = "",
  }) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={name}
            className={`block text-xs font-semibold uppercase tracking-wide ${TEXT_MUTED} mb-1 ml-1`}
          >
            {label}
          </label>
        )}
        {isFile ? (
          <div className="relative group">
            <input
              id={name}
              type="file"
              name={name}
              onChange={handleFileChange}
              accept="image/*"
              required={required}
              className={`block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-gray-100 file:text-gray-700
                hover:file:bg-gray-200
                cursor-pointer border ${BORDER_LIGHT} rounded-xl bg-gray-50/50 py-2 pl-2 transition duration-300`}
            />
          </div>
        ) : (
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
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    issuerTitle: "",
    institutionName: "",
    institutionLogo: null,
    signatureImage: null,
  });

  // --- Handlers ---

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "File size exceeds 5MB limit.",
      });
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [e.target.name]: reader.result }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    let url = "http://localhost:4000/register/student";
    let dataToSend = {};
    let finalRoleForVerify = role;

    if (role === "student") {
      dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
    } else if (role === "issuerVerifier") {
      finalRoleForVerify = "issuer";
      dataToSend = {
        issuerName: formData.name,
        issuerTitle: formData.issuerTitle,
        institutionName: formData.institutionName,
        email: formData.email,
        password: formData.password,
        institutionLogo: formData.institutionLogo,
        signatureImage: formData.signatureImage,
      };
      url = "http://localhost:4000/register/issuer";
    } else if (role === "admin") {
      dataToSend = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      url = "http://localhost:4000/register/admin";
    }

    try {
      const res = await axios.post(url, dataToSend);
      if (res.status === 201 || res.data.email) {
        setStatusMessage({
          type: "success",
          text: "✅ Registration successful! Redirecting...",
        });
        setTimeout(() => {
            navigate("/verifyOtp", {
            state: {
                email: res.data.email || formData.email,
                role: finalRoleForVerify,
            },
            });
        }, 1000);
      }
    } catch (err) {
      console.error("❌ Registration Error:", err);
      setStatusMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "❌ Registration failed. Please check your inputs.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Layout Logic ---
  const isIssuer = role === "issuerVerifier";

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-[#F9FAFB] p-4 font-sans overflow-hidden">
      <div
        className={`relative w-full  transition-all duration-500 ease-in-out ${
          isIssuer ? "max-w-5xl" : "max-w-md"
        } bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-white p-8 md:p-10 flex flex-col max-h-[95vh]`}
      >
        {/* Header Section */}
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-3xl font-extrabold tracking-tight mb-1">
            <GradientText>Create Account</GradientText>
          </h2>
          <p className={`text-sm ${TEXT_MUTED}`}>
            Join the decentralized certification platform.
          </p>
        </div>

        {/* Custom Role Selector (No Dropdown) */}
        <div className="bg-gray-100/80 p-1.5 rounded-2xl border border-gray-400  flex mb-6  self-center  ">
          <RoleTab
            currentRole={role}
            targetRole="student"
            label="Student"
            description="Credential Holder"
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
            description="Platform Manager"
            setRole={setRole}
          />
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 mb-4 rounded-xl text-center text-sm font-medium animate-pulse shrink-0 ${
              statusMessage.type === "error"
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-green-50 text-green-600 border border-green-100"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Scrollable Form Area */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow overflow-y-auto px-1 custom-scrollbar"
        >
          {isIssuer ? (
            /* --- ISSUER LAYOUT (2 Columns) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full">
              {/* Left Column: Personal Info */}
              <div className="flex flex-col gap-4">
                <div className="mb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">User Details</h3>
                    <div className="space-y-4">
                        <InputField
                        name="name"
                        placeholder="Authorized Person Name"
                        value={formData.name}
                        handleChange={handleChange}
                        />
                        <InputField
                        name="email"
                        type="email"
                        placeholder="Official Email Address"
                        value={formData.email}
                        handleChange={handleChange}
                        />
                        <InputField
                        name="password"
                        type="password"
                        placeholder="Secure Password"
                        value={formData.password}
                        handleChange={handleChange}
                        />
                        <InputField
                        name="issuerTitle"
                        placeholder="Job Title (e.g. Registrar)"
                        value={formData.issuerTitle}
                        handleChange={handleChange}
                        />
                    </div>
                </div>
              </div>

              {/* Right Column: Institution Info */}
              <div className="flex flex-col gap-4">
                 <div className="mb-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Organization</h3>
                    <div className="space-y-4">
                        <InputField
                        name="institutionName"
                        placeholder="Institution / Company Name"
                        value={formData.institutionName}
                        handleChange={handleChange}
                        />
                        <div className="space-y-3 pt-1">
                            <InputField
                                name="institutionLogo"
                                type="file"
                                isFile={true}
                                label="Organization Logo"
                                handleFileChange={handleFileChange}
                            />
                            <InputField
                                name="signatureImage"
                                type="file"
                                isFile={true}
                                label="Digital Signature"
                                handleFileChange={handleFileChange}
                            />
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            /* --- STUDENT / ADMIN LAYOUT (Single Column) --- */
            <div className="space-y-4">
              <InputField
                name="name"
                placeholder="Full Name"
                value={formData.name}
                handleChange={handleChange}
              />
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
                placeholder="Password (min 8 characters)"
                value={formData.password}
                handleChange={handleChange}
              />
            </div>
          )}

          {/* Action Area */}
          <div className="mt-8 pt-2 border-t border-gray-100 shrink-0">
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
                  <span>Processing...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className={`text-sm font-medium ${TEXT_MUTED} hover:${TEXT_DARK} transition duration-300`}
              >
                Already registered?{" "}
                <span className="font-bold underline decoration-2 decoration-gray-200 hover:decoration-gray-900">
                  Log in here.
                </span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;