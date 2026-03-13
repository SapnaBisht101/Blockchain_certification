import { QrCode, ShieldCheck, Database } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
const App = () => {

  const PrimaryButton = ({ to, children }) => (
    <Link
      to={to}
      className="px-7 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition text-sm font-semibold"
    >
      {children}
    </Link>
  );

  const SecondaryButton = ({ to, children }) => (
    <Link
      to={to}
      className="px-7 py-3 rounded-lg border border-gray-300 hover:border-blue-600 hover:text-blue-600 transition text-sm font-semibold"
    >
      {children}
    </Link>
  );


const HeroSection = () => (
  <section className="min-h-screen flex items-center px-6 md:px-20 bg-white ">
    <div className="grid md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">

      {/* LEFT SIDE */}

      <div>

        {/* small label */}

        <p className="text-sm text-gray-500 tracking-widest mb-4">
          BLOCKCHAIN + QR CODE = <span className="text-blue-600">
            TRUST
          </span>
        </p>

        {/* BRAND */}

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">

          <span className="text-gray-900">
            DE
          </span>

          <span className="text-blue-600">
            CIVE
          </span>

        </h1>

        {/* FULL FORM */}

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-4">
          Decentralized Certificate 
          <span className="text-blue-600"> Issuance </span>&
          <span className="text-blue-600"> Verification </span>
          Engine
        </h2>

        {/* DESCRIPTION */}

        <p className="mt-6 text-lg text-gray-600 max-w-xl">
          DECIVE enables institutions to issue tamper-proof digital
          certificates while allowing organizations to instantly verify
          credentials through secure QR authentication and immutable
          blockchain records.
        </p>

        {/* BUTTONS */}

        <div className="flex gap-4 mt-10">

          <PrimaryButton to="/login">
            Login
          </PrimaryButton>

          <SecondaryButton to="/learn">
            Learn More
          </SecondaryButton>

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex justify-center">

        <div className="p-[1px] rounded-xl bg-gradient-to-r from-blue-500 to-blue-300">

          <div className="bg-white rounded-xl p-3">

            <img
              src="/bchian_blue_image.png"
              alt="DECIVE blockchain certificate verification"
              className="rounded-lg max-w-md"
            />

          </div>

        </div>

      </div>

    </div>

  </section>
);




const FeaturesSection = () => (
  <section className="py-32 bg-gray-50 ">
   
    <div className="max-w-7xl mx-auto px-6 text-center">

      <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
        Built for
        <span className="text-blue-600"> Secure Certificate </span>
        Issuance & Verification
      </h3>

     

      <div className="grid md:grid-cols-3 gap-10 mt-20">

        <FeatureCard
          icon={<QrCode size={28} />}
          title="QR Based Verification"
          description="Every certificate contains a unique QR code that allows employers, institutions, and organizations to instantly verify authenticity."
        />

        <FeatureCard
          icon={<ShieldCheck size={28} />}
          title="Tamper-Proof Security"
          description="Blockchain-backed cryptographic signatures ensure certificates cannot be altered, duplicated, or forged."
        />

        <FeatureCard
          icon={<Database size={28} />}
          title="Permanent Blockchain Records"
          description="Each issued certificate is recorded on an immutable blockchain ledger, guaranteeing long-term authenticity."
        />

      </div>

    </div>

  </section>
);


const FeatureCard = ({ icon, title, description }) => (
  <div className="
    group
    bg-white
    border border-gray-200
    rounded-2xl
    p-8
    text-left
    transition-all
    duration-300
    ease-out
    hover:shadow-[0_10px_40px_rgba(37,99,235,0.15)]
    hover:border-blue-300
  ">

    {/* ICON */}

    <div className="
      w-12 h-12
      flex items-center justify-center
      rounded-lg
      bg-blue-50
      text-blue-600
      mb-5
      transition-all
      duration-300
      group-hover:bg-blue-600
      group-hover:text-white
    ">
      {icon}
    </div>

    {/* TITLE */}

    <h3 className="
      text-xl
      font-semibold
      text-gray-900
      mb-3
      transition-colors
      duration-300
      group-hover:text-blue-600
    ">
      {title}
    </h3>

    {/* DESCRIPTION */}

    <p className="text-gray-600 leading-relaxed">
      {description}
    </p>

  </div>
);




  const Footer = () => (
    <footer className="border-t border-gray-200 py-10 text-center text-gray-500 text-sm">

      <p>
        © {new Date().getFullYear()} DECIVE — Decentralized Certificate Verification Engine
      </p>

      <div className="flex justify-center gap-6 mt-3">

        <Link to="/privacy" className="hover:text-blue-600">
          Privacy
        </Link>

        <Link to="/support" className="hover:text-blue-600">
          Support
        </Link>

      </div>

    </footer>
  );


  return (
    <div className="w-full ">

      <HeroSection />

      <FeaturesSection />

      <Footer />

    </div>
  );
};

export default App;