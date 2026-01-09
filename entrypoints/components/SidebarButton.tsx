import React, { useState } from "react";

const SidebarButton: React.FC = () => {
	const [isHovered, setIsHovered] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = async () => {
		setIsLoading(true);
		try {
			const currentWindow = await browser.windows.getCurrent();
			await browser.sidePanel.open({ windowId: currentWindow.id });
		} catch (error) {
			console.error("Failed to open side panel:", error);

			// Fallback: Open in a new tab or show message
			browser.tabs.create({
				url: browser.runtime.getURL("sidepanel.html"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			disabled={isLoading}
			className={`
        absolute top-3 right-3 w-8 h-8 
        flex items-center justify-center
        bg-black/20 hover:bg-black/30 
        rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
			aria-label="Open prayer sidebar"
			title="Open detailed prayer times"
		>
			{isLoading ? (
				<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
			) : (
				<svg
					className={`w-5 h-5 transition-transform duration-200 ${
						isHovered ? "scale-110" : ""
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			)}

			{/* Hover Indicator */}
			{isHovered && !isLoading && (
				<div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping"></div>
			)}
		</button>
	);
};

export default SidebarButton;
