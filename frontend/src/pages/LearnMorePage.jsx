import React from "react";
import { Link } from "react-router-dom";
import { Zap, Database, Globe, Fingerprint, TrendingUp, Cpu } from "lucide-react";

// Helper component for the gradient black text effect
const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 ${className}`}
  >
    {children}
  </span>
);

const LearnMorePage = () => {
  // --- Tailwind Classes for Apple-Inspired Light Theme ---
  const LIGHT_BG = "bg-white";
  const TEXT_DARK = "text-gray-900";
  const TEXT_MUTED = "text-gray-600";
  const BORDER_LIGHT = "border-gray-200";

  // --- Components for the Learn More Page ---

  const Header = () => (
    <header className={`py-6 border-b ${BORDER_LIGHT} sticky top-0 z-20 ${LIGHT_BG} backdrop-blur-sm bg-opacity-90`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className={`text-xl font-bold tracking-tight ${TEXT_DARK} hover:opacity-80 transition duration-300`}>
          QR Certify
        </Link>
        <Link 
          to="/" 
          className={`px-4 py-2 text-sm font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-800 transition duration-300`}
        >
          Back to Home
        </Link>
      </div>
    </header>
  );

  const IntroSection = () => (
    <section className={`py-32 ${LIGHT_BG} text-center`}>
      <div className="max-w-4xl mx-auto px-6">
        <h1 className={`text-6xl md:text-8xl font-extrabold mb-6 tracking-tighter`}>
          <GradientText className="block leading-tight">
            The Future of Trust is Here.
          </GradientText>
        </h1>
        <p className={`text-2xl md:text-3xl ${TEXT_MUTED} max-w-2xl mx-auto font-light leading-relaxed`}>
          Explore the technology, security, and benefits that make QR Certify the global standard for digital credential validation.
        </p>
      </div>
    </section>
  );

  const DetailGrid = () => (
    <section className={`py-32 bg-gray-50 border-t ${BORDER_LIGHT}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className={`text-4xl md:text-6xl font-extrabold mb-4 tracking-tighter`}>
            <GradientText>
              Engineered for Integrity
            </GradientText>
          </h2>
          <p className={`text-xl ${TEXT_MUTED} max-w-3xl mx-auto font-light`}>
            A deep dive into the core technical specifications that ensure reliability and eliminate fraud.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          <DetailCard 
            icon={<Zap className="w-8 h-8 text-gray-800" />}
            title="Real-Time Verification"
            description="Our low-latency API infrastructure processes authentication requests globally in less than 50 milliseconds, providing instant results."
          />
          <DetailCard 
            icon={<Database className="w-8 h-8 text-gray-800" />}
            title="Decentralized Records"
            description="Credentials are stored using a secure, distributed ledger model, preventing single points of failure and protecting data permanence."
          />
          <DetailCard 
            icon={<Fingerprint className="w-8 h-8 text-gray-800" />}
            title="Cryptographic Signature"
            description="Each document is digitally signed by the issuing authority, making tampering immediately detectable and traceable."
          />
          <DetailCard 
            icon={<Globe className="w-8 h-8 text-gray-800" />}
            title="Zero-Downtime Scaling"
            description="Built on modern cloud architecture, the platform automatically scales to handle millions of verification requests simultaneously."
          />
          <DetailCard 
            icon={<TrendingUp className="w-8 h-8 text-gray-800" />}
            title="Audit-Ready Compliance"
            description="Comprehensive logging and immutable audit trails ensure compliance with industry-specific regulatory requirements globally."
          />
          <DetailCard 
            icon={<Cpu className="w-8 h-8 text-gray-800" />}
            title="Cross-Platform APIs"
            description="Seamless integration with existing HR, educational, and employer systems via robust and well-documented REST APIs."
          />
        </div>
      </div>
    </section>
  );

  const DetailCard = ({ icon, title, description }) => (
    <div className={`p-8 rounded-2xl bg-white border ${BORDER_LIGHT} shadow-lg hover:shadow-xl transition duration-500 ease-out transform hover:-translate-y-1`}>
      <div className={`p-4 inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gray-100/80 mb-6 shadow-inner`}>
        {icon}
      </div>
      <h3 className={`text-xl md:text-2xl font-semibold mb-3 tracking-tight`}>
        <GradientText>
          {title}
        </GradientText>
      </h3>
      <p className={`text-base ${TEXT_MUTED} leading-relaxed font-light`}>{description}</p>
    </div>
  );

  const Footer = () => (
    <footer className={`${LIGHT_BG} py-12 border-t ${BORDER_LIGHT} text-center ${TEXT_MUTED}`}>
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

  return (
    <div className="font-sans antialiased">
      <Header />
      <main>
        <IntroSection />
        <DetailGrid />
      </main>
      <Footer />
    </div>
  );
};

export default LearnMorePage;