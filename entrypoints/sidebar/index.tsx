/**
 * Sidebar Entrypoint for WXT
 * Main entry point for the sidebar panel
 * Handles theme initialization and React rendering
 */

import { useEffect } from "react";
import { Sidebar } from "@/entrypoints/components/Sidebar/Sidebar";
import { initializeTheme, applyThemeToDOM } from "@/utils/themeManager";
import "@/entrypoints/components/Sidebar/Sidebar.css";

/**
 * Root component for sidebar
 * WXT requires a default export that returns a React component
 */
const SidebarApp = () => {
	useEffect(() => {
		// Initialize theme on mount
		const initTheme = async () => {
			try {
				await initializeTheme("settings");
			} catch (error) {
				console.error("Failed to initialize theme:", error);
				// Fallback to default
				applyThemeToDOM("light");
			}
		};

		initTheme();
	}, []);

	return <Sidebar />;
};

export default SidebarApp;
