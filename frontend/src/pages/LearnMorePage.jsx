
import React from "react";
import { Link } from "react-router-dom";
import { QrCode, ShieldCheck, Database, Globe, FileCheck } from "lucide-react";

const LearnMorePage = () => {

const Header = () => (
<header className="py-6 border-b border-gray-200 bg-white sticky top-0 z-20">
<div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

<h1 className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight">
DECIVE
</h1>

<Link
to="/"
className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700"
>
Back to Home
</Link>

</div>
</header>
);


/* ================= SYSTEM FLOW ================= */

const SystemFlow = () => (
<section className="py-24 bg-white">

<div className="max-w-6xl mx-auto px-6">

<h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
DECIVE Verification Flow
</h2>

<div className="grid md:grid-cols-3 gap-10 items-center text-center">

<div className="p-8 border border-gray-200 rounded-xl">
<h3 className="font-semibold text-gray-900 mb-2">
Institution
</h3>
<p className="text-sm text-gray-600">
Creates and issues a digital certificate to students or professionals.
</p>
</div>

<div className="p-8 border border-blue-200 rounded-xl bg-blue-50">
<h3 className="font-semibold text-blue-700 mb-2">
Blockchain Network
</h3>
<p className="text-sm text-gray-600">
Certificate hash stored permanently on decentralized blockchain ledger.
</p>
</div>

<div className="p-8 border border-gray-200 rounded-xl">
<h3 className="font-semibold text-gray-900 mb-2">
Verifier
</h3>
<p className="text-sm text-gray-600">
Employers instantly validate credentials using QR verification.
</p>
</div>

</div>

</div>
</section>
);



/* ================= TIMELINE ================= */

const Step = ({number,title}) => (
<div className="flex items-center gap-6">

<div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
{number}
</div>

<div className="h-[2px] flex-1 bg-gray-200"></div>

<h3 className="text-gray-900 font-medium">
{title}
</h3>

</div>
);

const HowItWorks = () => (
<section className="py-24 bg-gray-50 border-t border-gray-200">

<div className="max-w-5xl mx-auto px-6">

<h2 className="text-3xl font-bold text-gray-900 text-center mb-20">
How DECIVE Works
</h2>

<div className="space-y-12">

<Step number="01" title="Institution issues certificate" />
<Step number="02" title="Certificate hash generated" />
<Step number="03" title="Hash stored on blockchain" />
<Step number="04" title="QR code embedded in certificate" />
<Step number="05" title="Verifier scans QR code" />
<Step number="06" title="Blockchain confirms authenticity" />

</div>

</div>

</section>
);



/* ================= SECURITY ================= */

const SecurityCard = ({icon,title}) => (
<div className="border border-gray-200 rounded-xl p-6 text-center">

<div className="w-12 h-12 bg-blue-50 text-blue-600 mx-auto mb-4 rounded-lg flex items-center justify-center">
{icon}
</div>

<p className="text-gray-800 font-medium">
{title}
</p>

</div>
);

const SecurityArchitecture = () => (
<section className="py-24 bg-white border-t border-gray-200">

<div className="max-w-6xl mx-auto px-6">

<h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
Security Architecture
</h2>

<div className="grid md:grid-cols-4 gap-8">

<SecurityCard icon={<FileCheck size={22}/>} title="Certificate Data" />
<SecurityCard icon={<Database size={22}/>} title="Cryptographic Hash" />
<SecurityCard icon={<ShieldCheck size={22}/>} title="Blockchain Ledger" />
<SecurityCard icon={<QrCode size={22}/>} title="QR Verification" />

</div>

</div>

</section>
);



/* ================= USE CASES ================= */

const UseCaseCard = ({icon,title}) => (
<div className="border border-gray-200 rounded-xl p-6">

<div className="text-blue-600 mb-3">
{icon}
</div>

<p className="text-gray-800 font-medium">
{title}
</p>

</div>
);

const UseCases = () => (
<section className="py-24 bg-gray-50 border-t border-gray-200">

<div className="max-w-6xl mx-auto px-6">

<h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
Use Cases
</h2>

<div className="grid md:grid-cols-3 gap-8">

<UseCaseCard icon={<FileCheck size={22}/>} title="University Certificates" />
<UseCaseCard icon={<Globe size={22}/>} title="Employer Verification" />
<UseCaseCard icon={<QrCode size={22}/>} title="Online Certifications" />

</div>

</div>

</section>
);



/* ================= CTA ================= */

const CTA = () => (
<section className="py-24 bg-white border-t border-gray-200 text-center">

<h2 className="text-3xl font-bold text-gray-900">
Verify Certificates Instantly
</h2>

<p className="text-gray-600 mt-4">
Use DECIVE blockchain verification system to validate credentials securely.
</p>

<Link
to="/login"
className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
Verify Certificate
</Link>

</section>
);



/* ================= FOOTER ================= */

const Footer = () => (
<footer className="py-10 border-t border-gray-200 text-center text-gray-500 text-sm">
© {new Date().getFullYear()} DECIVE — Decentralized Certificate Verification Engine
</footer>
);



return (
<div className="font-sans">

<Header/>

<main>

<SystemFlow/>
<HowItWorks/>
<SecurityArchitecture/>
<UseCases/>
<CTA/>

</main>

<Footer/>

</div>
);

};

export default LearnMorePage;

