import React, { useState, useEffect } from "react";
import "../popup/App.css";

export default function OptionsApp() {
	const [settings, setSettings] = useState({
		notifications: true,
		sound: true,
		timeFormat: "12h" as "12h" | "24h",
		calculationMethod: 2,
		theme: "light" as "light" | "dark",
	});

	// Load saved settings
	useEffect(() => {
		browser.storage.local.get("settings", (result) => {
			if (result.settings) {
				setSettings(result.settings);
				// Apply theme to HTML element
				applyTheme(result.settings.theme);
			}
		});
	}, []);

	// Apply theme to HTML element
	const applyTheme = (theme: "light" | "dark") => {
		const htmlElement = document.documentElement;
		if (theme === "dark") {
			htmlElement.classList.add("dark");
		} else {
			htmlElement.classList.remove("dark");
		}
	};

	// Listen for storage changes from other tabs/windows
	useEffect(() => {
		const handleStorageChange = (changes: any) => {
			if (changes.settings) {
				applyTheme(changes.settings.newValue.theme);
			}
		};
		browser.storage.onChanged.addListener(handleStorageChange);
		return () => browser.storage.onChanged.removeListener(handleStorageChange);
	}, []);

	// Save settings
	const saveSettings = () => {
		browser.storage.local.set({ settings }, () => {
			console.log("Settings saved");
			// Apply theme immediately
			applyTheme(settings.theme);
			// Send message to background script
			browser.runtime.sendMessage({ type: "SETTINGS_UPDATED", settings });
		});
	};

	// Handle input changes
	const handleChange = (key: keyof typeof settings, value: any) => {
		setSettings((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// Reset to defaults
	const resetDefaults = () => {
		setSettings({
			notifications: true,
			sound: true,
			timeFormat: "12h",
			calculationMethod: 2,
			theme: "light",
		});
	};

	return (
		<div className="min-h-screen relative bg-linear-to-br from-gray-50 to-gray-100 dark:from-[#161620] dark:to-[#0b0c0c] transition-colors duration-300">
			{/* Header */}
			<header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-[#0f3460]/90 border-b border-yellow-200/30 dark:border-white/10 shadow-sm">
				<div className="max-w-6xl mx-auto px-6 py-6">
					<div className="flex justify-between items-center">
						<h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
							My Prayer
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400">Settings</p>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-6xl mx-auto px-6 py-12">
				<div className="">
					{/* Theme Section */}
					<section className="glass-card rounded-t-2xl">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">🎨</span> Theme
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-4 bg-[#f8f8f836] dark:hover:bg-[#15191f] rounded-xl backdrop-blur-md hover:bg-[#fbfdf4] dark:bg-[#131416] transition-colors border border-gray-100 dark:border-white/10">
								<div>
									<h3 className="font-medium text-[15px] text-gray-900 dark:text-white">
										Dark Mode
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
										Switch between light and dark theme
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={settings.theme === "dark"}
										onChange={(e) =>
											handleChange("theme", e.target.checked ? "dark" : "light")
										}
										className="sr-only peer"
									/>
									<div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-600 dark:peer-focus:ring-green-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 dark:peer-checked:bg-green-600"></div>
								</label>
							</div>
						</div>
					</section>

					{/* Notifications Section */}
					<section className="glass-card">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">🔔</span> Notifications
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-4 bg-white/60 dark:bg-[#0f3460]/60 rounded-xl backdrop-blur-md hover:bg-white/80 dark:hover:bg-[#0f3460]/80 transition-colors border border-yellow-100/20 dark:border-white/10">
								<div>
									<h3 className="font-medium text-gray-900 dark:text-white">
										Enable Notifications
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
										Get prayer time reminders
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={settings.notifications}
										onChange={(e) =>
											handleChange("notifications", e.target.checked)
										}
										className="sr-only peer"
									/>
									<div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-600 dark:peer-focus:ring-green-500 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 dark:peer-checked:bg-green-600"></div>
								</label>
							</div>

							<div
								className="flex items-center justify-between p-4 bg-white/60 dark:bg-[#0f3460]/60 rounded-xl backdrop-blur-md hover:bg-white/80 dark:hover:bg-[#0f3460]/80 transition-colors border border-yellow-100/20 dark:border-white/10"
								style={{
									opacity: settings.notifications ? 1 : 0.5,
									pointerEvents: settings.notifications ? "auto" : "none",
								}}
							>
								<div>
									<h3 className="font-medium text-gray-900 dark:text-white">
										Adhan Sound
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
										Play sound with notifications
									</p>
								</div>
								<label className="relative inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={settings.sound}
										onChange={(e) => handleChange("sound", e.target.checked)}
										disabled={!settings.notifications}
										className="sr-only peer"
									/>
									<div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-500 dark:peer-focus:ring-yellow-400 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-600 dark:peer-checked:bg-amber-600"></div>
								</label>
							</div>
						</div>
					</section>

					{/* Display Section */}
					<section className="glass-card">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">⏰</span> Display
							</h2>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<h3 className="font-medium text-gray-900 dark:text-white mb-3">
									Time Format
								</h3>
								<div className="grid grid-cols-2 gap-3">
									<button
										onClick={() => handleChange("timeFormat", "12h")}
										className={`py-3 px-4 rounded-xl font-medium transition-all ${
											settings.timeFormat === "12h"
												? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-lg"
												: "bg-white/60 dark:bg-[#0f3460]/60 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-[#0f3460]/80 border border-yellow-100/20 dark:border-white/10"
										}`}
									>
										12-hour
									</button>
									<button
										onClick={() => handleChange("timeFormat", "24h")}
										className={`py-3 px-4 rounded-xl font-medium transition-all ${
											settings.timeFormat === "24h"
												? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-lg"
												: "bg-white/60 dark:bg-[#0f3460]/60 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-[#0f3460]/80 border border-yellow-100/20 dark:border-white/10"
										}`}
									>
										24-hour
									</button>
								</div>
							</div>
						</div>
					</section>

					{/* Calculation Method Section */}
					<section className="glass-card rounded-b-2xl">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">🧮</span> Calculation Method
							</h2>
						</div>
						<div className="p-6 space-y-3">
							{[
								{
									id: 2,
									name: "ISNA",
									desc: "Islamic Society of North America",
								},
								{ id: 4, name: "Umm al-Qura", desc: "Makkah, Saudi Arabia" },
								{
									id: 5,
									name: "Egyptian",
									desc: "Egyptian General Authority",
								},
								{
									id: 3,
									name: "Muslim World League",
									desc: "Muslim World League",
								},
								{
									id: 1,
									name: "Karachi",
									desc: "University of Islamic Sciences",
								},
								{
									id: 0,
									name: "Shia Ithna-Ansari",
									desc: "Shia Ithna-Ansari",
								},
							].map((method) => (
								<button
									key={method.id}
									onClick={() => handleChange("calculationMethod", method.id)}
									className={`w-full p-4 rounded-xl text-left transition-all border ${
										settings.calculationMethod === method.id
											? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-lg border-yellow-500"
											: "bg-white/60 dark:bg-[#0f3460]/60 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-[#0f3460]/80 border-yellow-100/20 dark:border-white/10"
									}`}
								>
									<div className="font-medium">{method.name}</div>
									<div
										className={`text-sm mt-1 ${
											settings.calculationMethod === method.id
												? "text-gray-800 opacity-90"
												: "text-gray-600 dark:text-gray-400"
										}`}
									>
										{method.desc}
									</div>
								</button>
							))}
						</div>
					</section>

					{/* Action Buttons */}
					<div className="space-y-3 mt-6 pb-8">
						<button
							onClick={saveSettings}
							className="fixed z-50 right-[8%] md:right-[10%] lg:right-[15%] bottom-[6%] px-8 py-3 text-[15px] cursor-pointer rounded-full bg-green-500 border border-green-600 font-bold text-white hover:border-green-500 hover:bg-green-600 transition-all hover:scale-105 active:scale-95 shadow-xl backdrop-blur-sm"
						>
							Save
						</button>

						<button
							onClick={resetDefaults}
							className="w-full px-6 py-4 bg-white/60 dark:bg-[#0f3460]/60 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-white/80 dark:hover:bg-[#0f3460]/80 transition-all backdrop-blur-sm border border-yellow-100/20 dark:border-white/10"
						>
							🔄 Reset to Defaults
						</button>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="text-center text-sm text-gray-600 dark:text-gray-400 pb-8 px-4">
				<p>My Prayer Extension v1.2.1</p>
				<p className="mt-2">
					<a
						href="https://github.com/mahmouddwidar/my-prayer"
						target="_blank"
						rel="noopener noreferrer"
						className="text-yellow-600 dark:text-yellow-400 hover:underline"
					>
						View on GitHub
					</a>
				</p>
			</footer>
		</div>
	);
}
