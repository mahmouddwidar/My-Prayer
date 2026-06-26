const DEFAULT_OPTIONS = {
	notification: false,
	selectedPrayers: ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
	latitude: "",
	longitude: "",
	city: "",
	country: "",
	timezone: "",
	theme: "system",
	sound: "soft",
};

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const LOCATION_SEARCH_DELAY = 320;
let currentOptions = { ...DEFAULT_OPTIONS };
let statusTimer;
let locationSearchTimer = null;

function getStorageApi() {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		return chrome.storage.local;
	}
	return null;
}

async function readPersistentSettings() {
	const storage = getStorageApi();
	if (storage) {
		const result = await storage.get(["options", "latitude", "longitude"]);
		return {
			options: result.options || {},
			latitude: result.latitude || "",
			longitude: result.longitude || "",
		};
	}

	const fallback = localStorage.getItem("myPrayerOptions");
	if (fallback) {
		const parsed = JSON.parse(fallback);
		return {
			options: parsed.options || {},
			latitude: parsed.latitude || "",
			longitude: parsed.longitude || "",
		};
	}

	return { options: {}, latitude: "", longitude: "" };
}

async function writePersistentSettings(data) {
	const storage = getStorageApi();
	if (storage) {
		await storage.set(data);
		return;
	}

	const existing = localStorage.getItem("myPrayerOptions");
	const parsed = existing ? JSON.parse(existing) : {};
	localStorage.setItem(
		"myPrayerOptions",
		JSON.stringify({ ...parsed, ...data }),
	);
}

const elements = {
	notificationToggle: document.getElementById("notificationToggle"),
	prayerOptions: Array.from(
		document.querySelectorAll('input[name="prayerOption"]'),
	),
	soundSelect: document.getElementById("soundSelect"),
	themeButtons: Array.from(document.querySelectorAll("[data-theme-option]")),
	locationSearchInput: document.getElementById("locationSearchInput"),
	locationSuggestions: document.getElementById("locationSuggestions"),
	locationStatus: document.getElementById("locationStatus"),
	locationLoader: document.getElementById("locationLoader"),
	locationSummary: document.getElementById("locationSummary"),
	locationName: document.getElementById("locationName"),
	locationMeta: document.getElementById("locationMeta"),
	clearLocationButton: document.getElementById("clearLocationButton"),
	refreshButton: document.getElementById("refreshButton"),
	saveStatus: document.getElementById("saveStatus"),
	previewTitle: document.getElementById("previewTitle"),
	previewMessage: document.getElementById("previewMessage"),
	previewPrayer: document.getElementById("previewPrayer"),
	previewTime: document.getElementById("previewTime"),
};

function init() {
	bindEvents();
	loadSettings();
}

function bindEvents() {
	elements.notificationToggle?.addEventListener("change", (event) => {
		currentOptions.notification = event.target.checked;
		saveSettings({ notification: currentOptions.notification });
	});

	elements.prayerOptions.forEach((checkbox) => {
		checkbox.addEventListener("change", () => {
			currentOptions.selectedPrayers = elements.prayerOptions
				.filter((input) => input.checked)
				.map((input) => input.value);
			if (currentOptions.selectedPrayers.length === 0) {
				currentOptions.selectedPrayers = ["Fajr"];
				elements.prayerOptions.find((input) => input.value === "Fajr").checked =
					true;
			}
			saveSettings({ selectedPrayers: currentOptions.selectedPrayers });
		});
	});

	elements.soundSelect?.addEventListener("change", (event) => {
		saveSettings({ sound: event.target.value });
	});

	elements.themeButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const value = button.dataset.themeOption;
			saveSettings({ theme: value });
			applyTheme(value);
		});
	});

	elements.locationSearchInput?.addEventListener(
		"input",
		handleLocationSearchInput,
	);
	elements.locationSuggestions?.addEventListener(
		"click",
		handleSuggestionClick,
	);
	elements.clearLocationButton?.addEventListener(
		"click",
		clearLocationSelection,
	);
	elements.refreshButton?.addEventListener("click", handleRefresh);
}

async function loadSettings() {
	try {
		const result = await readPersistentSettings();
		const savedOptions = result.options || {};

		currentOptions = {
			...DEFAULT_OPTIONS,
			...savedOptions,
			latitude: result.latitude || savedOptions.latitude || "",
			longitude: result.longitude || savedOptions.longitude || "",
			selectedPrayers:
				Array.isArray(savedOptions.selectedPrayers) &&
				savedOptions.selectedPrayers.length
					? savedOptions.selectedPrayers
					: DEFAULT_OPTIONS.selectedPrayers,
		};

		populateForm();
		applyTheme(currentOptions.theme);
		updateLocationSearchState();
		updatePreview();
	} catch (error) {
		console.error("Failed to load settings", error);
	}
}

function populateForm() {
	elements.notificationToggle.checked = Boolean(currentOptions.notification);

	elements.prayerOptions.forEach((checkbox) => {
		checkbox.checked = currentOptions.selectedPrayers.includes(checkbox.value);
	});

	elements.soundSelect.value = currentOptions.sound || "soft";
	elements.locationSearchInput.value = currentOptions.city
		? `${currentOptions.city}, ${currentOptions.country || ""}`
		: "";
	updateThemeButtons();
	renderLocationSummary();
}

function updateThemeButtons() {
	elements.themeButtons.forEach((button) => {
		button.classList.toggle(
			"active",
			button.dataset.themeOption === currentOptions.theme,
		);
	});
}

function applyTheme(themeValue) {
	const resolvedTheme =
		themeValue === "system"
			? window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: themeValue;

	document.documentElement.dataset.theme = resolvedTheme;
	updateThemeButtons();
}

async function saveSettings(partial) {
	currentOptions = { ...currentOptions, ...partial };

	try {
		await writePersistentSettings({ options: currentOptions });
		updatePreview();
		showStatus("Settings saved");
	} catch (error) {
		console.error("Failed to save settings", error);
		showStatus("Could not save");
	}
}

function showStatus(message) {
	if (!elements.saveStatus) return;

	elements.saveStatus.textContent = message;
	elements.saveStatus.classList.add("is-visible");
	clearTimeout(statusTimer);
	statusTimer = window.setTimeout(() => {
		elements.saveStatus.classList.remove("is-visible");
	}, 1400);
}

async function handleRefresh() {
	try {
		if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
			await chrome.runtime.sendMessage({ type: "refreshPrayerTimes" });
		}
		showStatus("Prayer timings refreshed");
	} catch (error) {
		console.error("Refresh failed", error);
		showStatus("Refresh failed");
	}
}

function debounce(callback, delay) {
	clearTimeout(locationSearchTimer);
	locationSearchTimer = window.setTimeout(callback, delay);
}

async function handleLocationSearchInput(event) {
	const query = event.target.value.trim();
	updateLocationSearchState();

	if (!query) {
		clearLocationSuggestions();
		showLocationStatus("Type a city, region, or country to search.");
		return;
	}

	showLocationStatus("Searching…");
	showLocationLoader(true);

	debounce(async () => {
		try {
			const suggestions = await fetchLocationSuggestions(query);
			renderLocationSuggestions(suggestions);
			showLocationLoader(false);
			if (!suggestions.length) {
				showLocationStatus("No matching locations found.", true);
			}
		} catch (error) {
			console.error("Location search failed", error);
			showLocationLoader(false);
			showLocationStatus("Unable to fetch locations.", true);
		}
	}, LOCATION_SEARCH_DELAY);
}

async function fetchLocationSuggestions(query) {
	const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&extratags=1&accept-language=en`;
	const response = await fetch(url, {
		headers: {
			"User-Agent": "MyPrayerExtension/1.0 (contact: example@example.com)",
		},
	});
	if (!response.ok) {
		throw new Error("Failed to fetch location suggestions");
	}

	const data = await response.json();
	return data.map((item) => ({
		id: item.place_id,
		label: item.display_name,
		latitude: item.lat,
		longitude: item.lon,
		country: item.address?.country || "",
		city:
			item.address?.city ||
			item.address?.town ||
			item.address?.village ||
			item.address?.state ||
			item.address?.county ||
			item.address?.country ||
			"",
		timezone: item.extratags?.timezone || "",
	}));
}

function renderLocationSuggestions(locations) {
	if (!elements.locationSuggestions) return;
	elements.locationSuggestions.innerHTML = "";

	if (!locations.length) {
		const noneItem = document.createElement("li");
		noneItem.className = "suggestion-item";
		noneItem.textContent = "No matching locations found.";
		return elements.locationSuggestions.appendChild(noneItem);
	}

	locations.forEach((location) => {
		const item = document.createElement("li");
		item.className = "suggestion-item";
		item.setAttribute("role", "option");
		item.tabIndex = 0;
		item.dataset.placeId = location.id;
		item.dataset.latitude = location.latitude;
		item.dataset.longitude = location.longitude;
		item.dataset.city = location.city;
		item.dataset.country = location.country;
		item.dataset.timezone = location.timezone;

		item.innerHTML = `
			<span class="suggestion-title">${location.city}</span>
			<span class="suggestion-description">${location.label}</span>
		`;
		elements.locationSuggestions.appendChild(item);
	});
}

function clearLocationSuggestions() {
	if (!elements.locationSuggestions) return;
	elements.locationSuggestions.innerHTML = "";
}

function showLocationLoader(isLoading) {
	if (!elements.locationLoader) return;
	elements.locationLoader.classList.toggle("active", isLoading);
}

function showLocationStatus(message, isError = false) {
	if (!elements.locationStatus) return;
	elements.locationStatus.textContent = message;
	elements.locationStatus.style.color = isError ? "#d34b4b" : "";
}

function handleSuggestionClick(event) {
	const item = event.target.closest(".suggestion-item");
	if (!item) return;

	const latitude = item.dataset.latitude;
	const longitude = item.dataset.longitude;
	const city = item.dataset.city;
	const country = item.dataset.country;
	const timezone = item.dataset.timezone;

	currentOptions.latitude = latitude;
	currentOptions.longitude = longitude;
	currentOptions.city = city;
	currentOptions.country = country;
	currentOptions.timezone = timezone;

	elements.locationSearchInput.value = `${city}, ${country}`;
	renderLocationSummary();
	clearLocationSuggestions();
	showLocationStatus("Location selected. Coordinates saved automatically.");

	writePersistentSettings({
		latitude,
		longitude,
		options: currentOptions,
	});
	saveSettings({
		latitude,
		longitude,
		city,
		country,
		timezone,
	});
	triggerLocationRefresh();
}

function renderLocationSummary() {
	if (!elements.locationSummary) return;

	if (currentOptions.city || currentOptions.country) {
		elements.locationSummary.hidden = false;
		elements.locationName.textContent = `${currentOptions.city}${currentOptions.country ? `, ${currentOptions.country}` : ""}`;
		elements.locationMeta.textContent = currentOptions.timezone
			? `Latitude ${currentOptions.latitude}, Longitude ${currentOptions.longitude} · ${currentOptions.timezone}`
			: `Latitude ${currentOptions.latitude}, Longitude ${currentOptions.longitude}`;
	} else {
		elements.locationSummary.hidden = true;
	}
}

function clearLocationSelection() {
	currentOptions.latitude = "";
	currentOptions.longitude = "";
	currentOptions.city = "";
	currentOptions.country = "";
	currentOptions.timezone = "";

	elements.locationSearchInput.value = "";
	clearLocationSuggestions();
	renderLocationSummary();
	showLocationStatus(
		"Search for a location to save coordinates automatically.",
	);

	writePersistentSettings({
		latitude: "",
		longitude: "",
		options: currentOptions,
	});
	saveSettings({
		latitude: "",
		longitude: "",
		city: "",
		country: "",
		timezone: "",
	});
	triggerLocationRefresh();
}

function updateLocationSearchState() {
	if (elements.locationSearchInput) {
		elements.locationSearchInput.disabled = false;
		elements.locationSearchInput.placeholder =
			"Type a city, region, or country";
	}

	showLocationStatus(
		"Search for a location to save coordinates automatically.",
	);
	clearLocationSuggestions();
}

function triggerLocationRefresh() {
	if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
		chrome.runtime
			.sendMessage({ type: "refreshPrayerTimes" })
			.catch((error) => {
				console.error("Failed to request prayer refresh:", error);
			});
	}
}

function updatePreview() {
	const prayerList = currentOptions.selectedPrayers?.length
		? currentOptions.selectedPrayers
		: DEFAULT_OPTIONS.selectedPrayers;
	const featuredPrayer = prayerList[0] || "Fajr";

	elements.previewTitle.textContent = currentOptions.notification
		? "Prayer reminder"
		: "Silent mode";
	elements.previewMessage.textContent = currentOptions.notification
		? `You'll get a gentle reminder for ${featuredPrayer}${prayerList.length > 1 ? ` and ${prayerList.length - 1} more` : ""}.`
		: "Notifications are paused for now.";

	elements.previewPrayer.textContent = featuredPrayer;
	elements.previewTime.textContent = currentOptions.notification
		? "3:30 PM"
		: "—";
}

document.addEventListener("DOMContentLoaded", init);
