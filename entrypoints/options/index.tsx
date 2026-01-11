import React from "react";
import { createRoot } from "react-dom/client";
import OptionsApp from "./OptionsApp";
// import "./index.css"; // Optional custom CSS

const container = document.getElementById("root");

if (!container) {
	throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
	<React.StrictMode>
		<OptionsApp />
	</React.StrictMode>
);
