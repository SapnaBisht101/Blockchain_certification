import { QrCode, ShieldCheck, Cloud } from "lucide-react"; // ✅ Lucide professional icons
import React from "react";
import { Link } from "react-router-dom";

// Helper component for the gradient black text effect (from gray-900 to gray-500)
const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 ${className}`}
  >
    {children}
  </span>
);

const App = () => {
  // --- Tailwind Classes for Apple-Inspired Light Theme ---
  const LIGHT_BG = "bg-white"; 
  const TEXT_DARK = "text-gray-900"; 
  const TEXT_MUTED = "text-gray-600"; 
  const BORDER_LIGHT = "border-gray-200"; 

  // --- Components for a clean structure ---

  const MinimalButton = ({ to, children, primary = false }) => {
    const baseClasses = "px-8 py-3 text-lg font-semibold rounded-full transition duration-500 ease-in-out tracking-tight shadow-md transform hover:scale-[1.02] active:scale-[0.98]";
    
    // Primary Button: Dark, minimal, sleek (Apple's standard CTA)
    const primaryClasses = `bg-gray-900 text-white border-2 border-gray-900 hover:bg-gray-800`;

    // Secondary Button: Light, outline, subtle
    const secondaryClasses = `${TEXT_DARK} bg-white border ${BORDER_LIGHT} hover:bg-gray-100 shadow-xl shadow-gray-200/50`;

    // Dark button stands out as the primary action
    return (
      <Link
        to={to}
        className={`${baseClasses} ${primary ? primaryClasses : secondaryClasses}`}
      >
        {children}
      </Link>
    );
  };

  const HeroSection = () => (
    <section className={`flex flex-col md:flex-row items-center justify-between min-h-screen pt-32 pb-24 md:pt-0 px-6 md:px-20 ${LIGHT_BG} overflow-hidden`}>
      
      {/* Subtle Background Gradient Overlay */}
      <div className="absolute inset-0 z-0 opacity-5" style={{ background: 'radial-gradient(circle at 50% 10%, #f0f4f8, transparent 70%)' }}></div>
      
      {/* Left: Text Content - Focus on typography and space */}
      <div className="md:w-1/2 text-center md:text-left order-2 md:order-1 mt-10 md:mt-0 z-10">
        <h1 className={`text-6xl md:text-8xl font-extrabold mb-6 ${TEXT_DARK}`}>
          {/* Main Heading with large, tight gradient text */}
      <GradientText className=" text-5xl md:text-7xl tracking-tighter pr-2">

            QR Certify

          </GradientText>
          {/* Sub-heading in light font weight, contrasting the main title */}
          <span className="block mt-6 text-4xl md:text-5xl font-light tracking-tight">
            Digital Trust Simplified.
          </span>
        </h1>
        <p className={`text-xl md:text-2xl ${TEXT_MUTED} mb-12 max-w-xl mx-auto md:mx-0 font-light`}>
          The secure, <strong>instant verification platform</strong> built for modern institutions and professionals, backed by verifiable integrity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <MinimalButton to="/login" primary={true}>
            Start Verification
          </MinimalButton>
          <MinimalButton to="/learn">
            Learn More
          </MinimalButton>
        </div>
      </div>

      {/* Right: Minimal Visual - Clean, elevated image */}
      <div className="md:w-1/2 flex justify-center order-1 md:order-2 z-10">
        <div className="relative p-3 bg-white rounded-3xl shadow-2xl shadow-gray-300/50">
          <img
            src="/hero_section.jpg" // Placeholder for your sleek image
            alt="Digital Certificate Verification"
            // Apple-like animation: subtle elevation and rotation on hover
            className="w-full max-w-lg object-cover rounded-2xl border border-gray-100 transform hover:scale-[1.03] hover:rotate-[0.5deg] transition duration-700 ease-out"
          />
        </div>
      </div>
    </section>
  );

  const FeaturesSection = () => (
    <section className={`py-40 bg-gray-50`}> {/* Increased padding for more white space */}
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Feature Heading with Gradient Text */}
        <h2 className={`text-4xl md:text-6xl font-extrabold mb-4 tracking-tighter`}>
          <GradientText>
            The Core Pillars of Trust
          </GradientText>
        </h2>
        <p className={`text-xl ${TEXT_MUTED} mb-24 max-w-3xl mx-auto font-light`}>
          Efficiency meets uncompromising security, designed for a world where credentials must be instant and irrefutable.
        </p>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <FeatureCard
            icon={<QrCode className="w-8 h-8 text-gray-800" />} // Adjusted icon color to fit the sleek theme
            title="Instant QR Scan"
            description="Validate credentials in a single tap using a secure, dynamically generated QR code."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-8 h-8 text-gray-800" />}
            title="Encrypted Integrity"
            description="Every record is immutable and cryptographically secured, eliminating forgery risk."
          />
          <FeatureCard
            icon={<Cloud className="w-8 h-8 text-gray-800" />}
            title="Global Accessibility"
            description="A cloud-based standard ensuring verifiable credentials are accessible worldwide, 24/7."
          />
        </div>
      </div>
    </section>
  );

  const FeatureCard = ({ icon, title, description }) => {
    return (
      <div className={`p-8 rounded-2xl bg-white border ${BORDER_LIGHT} shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/70 transition duration-500 ease-out transform hover:-translate-y-1`}>
        
        {/* Apple-like icon container: soft shadow, minimal design */}
        <div className={`p-4 inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gray-100/80 mb-6 shadow-inner`}>
          {icon}
        </div>
        
        {/* Feature Card Heading with Gradient Text */}
        <h3 className={`text-xl md:text-2xl font-semibold mb-3 tracking-tight`}>
          <GradientText>
            {title}
          </GradientText>
        </h3>
        <p className={`text-base ${TEXT_MUTED} leading-relaxed font-light`}>{description}</p>
      </div>
    );
  };

  const Footer = () => (
    <footer className={`${LIGHT_BG} py-12 border-t ${BORDER_LIGHT} text-center ${TEXT_MUTED}`}> {/* Increased padding */}
      <p className="text-sm">
        © {new Date().getFullYear()} QR Certify. All rights reserved.
      </p>
      <div className="flex justify-center gap-4 mt-2">
        <Link to="/privacy" className={`text-sm hover:${TEXT_DARK} transition font-medium`}>Privacy Policy</Link>
        <span className="text-gray-400">|</span>
        <Link to="/support" className={`text-sm hover:${TEXT_DARK} transition font-medium`}>Support</Link>
      </div>
    </footer>
  );

  // --- Main App Render ---

  return (
    <div className=" antialiased">
      <main>
        <HeroSection />
        <FeaturesSection />
        
      </main>
      <Footer />
    </div>
  );
};

export default App; 