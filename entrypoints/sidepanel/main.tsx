import React from "react";
import ReactDOM from "react-dom/client";
import SidepanelApp from "./index.tsx";
// import "./style.css";
import { initializeTheme } from "@/utils/themeManager";

// Initialize theme before rendering
initializeTheme("settings").catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<SidepanelApp />
	</React.StrictMode>,
);
