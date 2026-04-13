import React, { useState, useEffect } from "react";
import "../popup/App.css";
import SettingCard from "../components/options/SettingCard";
import NotificationSettings from "../components/options/NotificationSettings";
import {
	validateCoordinates,
	formatCoordinates,
} from "@/utils/locationValidator";
import { Coordinates } from "@/types/api";
import {
	GeocodingClient,
	GeocodingResult,
} from "@/api/clients/geocodingClient";
import { useTheme } from "@/hooks/useTheme";

export default function OptionsApp() {
	// Use centralized theme hook for global theme management
	const { theme, setTheme } = useTheme("settings");

	const [settings, setSettings] = useState({
		notifications: true,
		sound: true,
		timeFormat: "12h" as "12h" | "24h",
		calculationMethod: 2,
		theme: "light" as "light" | "dark",
	});

	// Manual location state
	const [manualLocation, setManualLocation] = useState<Coordinates | null>(
		null,
	);
	const [locationTab, setLocationTab] = useState<"city" | "coordinates">(
		"city",
	);
	const [citySearch, setCitySearch] = useState("");
	const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [locationErrors, setLocationErrors] = useState<string[]>([]);
	const [locationSuccess, setLocationSuccess] = useState(false);
	const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(
		null,
	);

	// Load saved settings
	useEffect(() => {
		browser.storage.local.get("settings", (result: any) => {
			if (result.settings) {
				setSettings(result.settings as typeof settings);
			}
		});

		// Load manual location
		browser.storage.local.get("manualLocation", (result: any) => {
			if (result.manualLocation) {
				const location = result.manualLocation as Coordinates;
				setManualLocation(location);
				setLatitude(location.latitude.toString());
				setLongitude(location.longitude.toString());
			}
		});
	}, []);

	// Listen for storage changes from other tabs/windows (other than theme, which is handled by useTheme hook)
	useEffect(() => {
		const handleStorageChange = (changes: any) => {
			// Theme changes are automatically handled by useTheme hook
			// This listener handles other settings updates
			if (changes.settings && !changes.settings.newValue?.theme) {
				// Sync other settings if needed
			}
		};
		browser.storage.onChanged.addListener(handleStorageChange);
		return () => browser.storage.onChanged.removeListener(handleStorageChange);
	}, []);

	// Handle input changes
	const handleChange = (key: keyof typeof settings, value: any) => {
		const updatedSettings = {
			...settings,
			[key]: value,
		};
		setSettings(updatedSettings);

		// Handle theme change through centralized hook
		if (key === "theme") {
			setTheme(value as "light" | "dark").catch(console.error);
		}

		// Save settings immediately
		browser.storage.local.set({ settings: updatedSettings }, () => {
			console.log("Settings saved");
		});

		// Send message to background script
		browser.runtime.sendMessage({
			type: "SETTINGS_UPDATED",
			settings: updatedSettings,
		});
	};

	// Handle save manual location
	const handleSaveLocation = () => {
		setLocationErrors([]);
		setLocationSuccess(false);

		const validation = validateCoordinates(latitude, longitude);

		if (!validation.isValid) {
			setLocationErrors(validation.errors);
			return;
		}

		const coords: Coordinates = {
			latitude: parseFloat(latitude),
			longitude: parseFloat(longitude),
		};

		browser.storage.local.set({ manualLocation: coords }, () => {
			setManualLocation(coords);
			setLocationSuccess(true);
			console.log("Manual location saved:", coords);

			// Clear success message after 3 seconds
			setTimeout(() => setLocationSuccess(false), 3000);

			// Notify background script
			browser.runtime.sendMessage({
				type: "LOCATION_UPDATED",
				location: coords,
			});
		});
	};

	// Handle city search
	const handleCitySearch = async () => {
		if (!citySearch.trim()) {
			setLocationErrors(["Please enter a city name"]);
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		setLocationErrors([]);
		setSearchResults([]);

		try {
			const results = await GeocodingClient.searchByCity(citySearch);
			if (results.length === 0) {
				setLocationErrors(["No locations found. Try a different city name."]);
			} else {
				setSearchResults(results);
			}
		} catch (error) {
			setLocationErrors([
				"Search failed. Please check your city name and try again.",
			]);
		} finally {
			setIsSearching(false);
		}
	};

	// Handle selecting a search result
	const handleSelectLocation = (result: GeocodingResult) => {
		setSelectedResult(result);
		setLatitude(result.latitude.toString());
		setLongitude(result.longitude.toString());
		setLocationErrors([]);
		setCitySearch("");
		setSearchResults([]);
	};

	// Handle save location from search result
	const handleSaveSearchLocation = () => {
		if (!selectedResult) return;

		const coords: Coordinates = {
			latitude: selectedResult.latitude,
			longitude: selectedResult.longitude,
		};

		browser.storage.local.set({ manualLocation: coords }, () => {
			setManualLocation(coords);
			setLocationSuccess(true);
			console.log("Location saved:", coords);

			// Clear success message after 3 seconds
			setTimeout(() => setLocationSuccess(false), 3000);

			// Notify background script
			browser.runtime.sendMessage({
				type: "LOCATION_UPDATED",
				location: coords,
			});
		});
	};

	// Handle clear manual location
	const handleClearLocation = () => {
		browser.storage.local.remove("manualLocation", () => {
			setManualLocation(null);
			setLatitude("");
			setLongitude("");
			setLocationErrors([]);
			console.log("Manual location cleared");

			// Notify background script
			browser.runtime.sendMessage({
				type: "LOCATION_CLEARED",
			});
		});
	};

	// Reset to defaults
	const resetDefaults = () => {
		const defaultSettings = {
			notifications: true,
			sound: true,
			timeFormat: "12h" as const,
			calculationMethod: 2,
			theme: "light" as const,
		};

		setSettings(defaultSettings);

		// Reset theme through centralized hook
		setTheme("light").catch(console.error);

		// Save to storage
		browser.storage.local.set({ settings: defaultSettings }, () => {
			console.log("Settings reset to defaults");
		});

		// Send message to background script
		browser.runtime.sendMessage({
			type: "SETTINGS_UPDATED",
			settings: defaultSettings,
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
						<SettingCard
							title="Dark Mode"
							desc="Switch between light and dark theme"
						>
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
						</SettingCard>
					</section>

					{/* Notifications Section - Per-Prayer Customization */}
					<section className="glass-card">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">🔔</span> Notifications
							</h2>
						</div>
						<NotificationSettings />
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

					{/* Location Section */}
					<section className="glass-card">
						<div className="p-6 border-b border-yellow-100/30 dark:border-white/5">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
								<span className="text-xl">📍</span> Manual Location
							</h2>
						</div>
						<div className="p-6 space-y-4">
							{manualLocation && (
								<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
									<p className="text-sm text-green-800 dark:text-green-200">
										✓ Current location: {formatCoordinates(manualLocation)}
									</p>
								</div>
							)}

							{locationSuccess && (
								<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
									<p className="text-sm text-green-800 dark:text-green-200">
										✓ Location saved successfully!
									</p>
								</div>
							)}

							{locationErrors.length > 0 && (
								<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
									<ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
										{locationErrors.map((error, index) => (
											<li key={index}>• {error}</li>
										))}
									</ul>
								</div>
							)}

							{/* Tabs */}
							<div className="flex gap-2 border-b border-yellow-100/30 dark:border-white/10">
								<button
									onClick={() => setLocationTab("city")}
									className={`px-4 py-2 font-medium transition-all ${
										locationTab === "city"
											? "text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									🏙️ By City Name
								</button>
								<button
									onClick={() => setLocationTab("coordinates")}
									className={`px-4 py-2 font-medium transition-all ${
										locationTab === "coordinates"
											? "text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
									}`}
								>
									📐 By Coordinates
								</button>
							</div>

							{/* City Search Tab */}
							{locationTab === "city" && (
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
											City Name
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												value={citySearch}
												onChange={(e) => setCitySearch(e.target.value)}
												onKeyPress={(e) =>
													e.key === "Enter" && handleCitySearch()
												}
												placeholder="e.g., Alexandria, Egypt"
												className="flex-1 px-4 py-2 rounded-lg bg-white/60 dark:bg-[#0f3460]/60 border border-yellow-100/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
											/>
											<button
												onClick={handleCitySearch}
												disabled={isSearching}
												className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
											>
												{isSearching ? "🔄" : "🔍"}
											</button>
										</div>
										<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
											Enter city name, e.g., "New York, USA" or "Cairo, Egypt"
										</p>
									</div>

									{/* Search Results */}
									{searchResults.length > 0 && (
										<div className="space-y-2">
											<p className="text-xs font-medium text-gray-700 dark:text-gray-300">
												Search Results:
											</p>
											{searchResults.map((result, index) => (
												<div
													key={index}
													onClick={() => handleSelectLocation(result)}
													className={`p-3 rounded-lg cursor-pointer transition-all border ${
														selectedResult?.city === result.city &&
														selectedResult?.latitude === result.latitude
															? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600"
															: "bg-white/60 dark:bg-[#0f3460]/60 border-yellow-100/30 dark:border-white/10 hover:bg-white/80 dark:hover:bg-[#0f3460]/80"
													}`}
												>
													<div className="font-medium text-gray-900 dark:text-white">
														{result.city}
														{result.state && `, ${result.state}`}
													</div>
													<div className="text-xs text-gray-600 dark:text-gray-400">
														{result.country} • {result.latitude.toFixed(4)},{" "}
														{result.longitude.toFixed(4)}
													</div>
												</div>
											))}
										</div>
									)}

									{/* Selected Location Display */}
									{selectedResult && (
										<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
											<p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
												Selected Location:
											</p>
											<p className="text-sm text-blue-800 dark:text-blue-300">
												{selectedResult.city}, {selectedResult.country}
											</p>
											<p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
												{selectedResult.latitude.toFixed(4)},{" "}
												{selectedResult.longitude.toFixed(4)}
											</p>
										</div>
									)}

									{selectedResult && (
										<button
											onClick={handleSaveSearchLocation}
											className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
										>
											💾 Save This Location
										</button>
									)}
								</div>
							)}

							{/* Coordinates Tab */}
							{locationTab === "coordinates" && (
								<div className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
												Latitude
											</label>
											<input
												type="number"
												min="-90"
												max="90"
												step="0.0001"
												value={latitude}
												onChange={(e) => setLatitude(e.target.value)}
												placeholder="e.g., 31.2956"
												className="w-full px-4 py-2 rounded-lg bg-white/60 dark:bg-[#0f3460]/60 border border-yellow-100/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
											/>
											<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
												Range: -90 to 90
											</p>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
												Longitude
											</label>
											<input
												type="number"
												min="-180"
												max="180"
												step="0.0001"
												value={longitude}
												onChange={(e) => setLongitude(e.target.value)}
												placeholder="e.g., 30.0444"
												className="w-full px-4 py-2 rounded-lg bg-white/60 dark:bg-[#0f3460]/60 border border-yellow-100/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
											/>
											<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
												Range: -180 to 180
											</p>
										</div>
									</div>

									<button
										onClick={handleSaveLocation}
										className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
									>
										💾 Save Location
									</button>
								</div>
							)}

							{/* Clear Location Button */}
							{manualLocation && (
								<button
									onClick={handleClearLocation}
									className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
								>
									🗑️ Clear Location
								</button>
							)}

							<p className="text-xs text-gray-600 dark:text-gray-400 border-t border-yellow-100/30 dark:border-white/5 pt-4">
								💡 Search by city name or enter coordinates manually. Leave
								empty to use automatic location detection.
							</p>
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
