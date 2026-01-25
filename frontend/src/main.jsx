import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GlobalMessageProvider } from "./pages/GlobalMessageProvider.jsx";

createRoot(document.getElementById("root")).render(
   <GlobalMessageProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
   </GlobalMessageProvider>
);
