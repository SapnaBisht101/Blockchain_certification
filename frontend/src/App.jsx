import "./App.css";
import {Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Verify from "./pages/issuer/Verify";
import Login from "./pages/Login";
import Main from "./pages/Main"
import AdminPage from "./pages/admin/Admin";
import StudentPage from "./pages/student/Student";
import IssuerVerifierPage from "./pages/issuer/Issuer";
import Template from "./pages/issuer/Certificate_Tempelate";
import LearnMorePage from "./pages/LearnMorePage";
import CertificateDetails from "./pages/issuer/CertificateDetails";
import VerifyOtp from "./pages/VerifyOtp";
import ForgetPassword from "./pages/ForgetPassword";
function App() {
  return (
    <>
    
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/issue" element={<Template />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element = {<AdminPage/>}/>
          <Route path="/student" element = {<StudentPage/>}/>
          <Route path="/issuer" element = {<IssuerVerifierPage/>}/>
          <Route path="/learn" element = {<LearnMorePage/>}/>
          <Route path="/view-certificate" element = {<CertificateDetails/>}/>
          <Route path="/verifyOtp" element={<VerifyOtp/>}/>
          <Route path="/forget" element={<ForgetPassword/>}/>
          

        </Routes>
    </>
  );
}

export default App;
