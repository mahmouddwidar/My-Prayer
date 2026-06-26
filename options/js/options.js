const DEFAULT_OPTIONS = {
	notification: false,
	selectedPrayers: ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
	locationMode: "auto",
	latitude: "",
	longitude: "",
	theme: "system",
	sound: "soft",
};

let currentOptions = { ...DEFAULT_OPTIONS };
let statusTimer;

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
	locationModeButtons: Array.from(
		document.querySelectorAll("[data-location-mode]"),
	),
	latitudeInput: document.getElementById("latitudeInput"),
	longitudeInput: document.getElementById("longitudeInput"),
	detectButton: document.getElementById("detectButton"),
	saveLocationButton: document.getElementById("saveLocationButton"),
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

	elements.locationModeButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const mode = button.dataset.locationMode;
			currentOptions.locationMode = mode;
			saveSettings({ locationMode: mode });
			updateLocationModeButtons();
		});
	});

	elements.detectButton?.addEventListener("click", handleAutoDetect);
	elements.saveLocationButton?.addEventListener(
		"click",
		handleManualLocationSave,
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
	elements.latitudeInput.value = currentOptions.latitude || "";
	elements.longitudeInput.value = currentOptions.longitude || "";
	updateLocationModeButtons();
	updateThemeButtons();
}

function updateLocationModeButtons() {
	elements.locationModeButtons.forEach((button) => {
		button.classList.toggle(
			"active",
			button.dataset.locationMode === currentOptions.locationMode,
		);
	});
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

async function handleAutoDetect() {
	if (!navigator.geolocation) {
		showStatus("Geolocation is not available");
		return;
	}

	try {
		const position = await new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject);
		});

		const latitude = position.coords.latitude.toFixed(5);
		const longitude = position.coords.longitude.toFixed(5);

		currentOptions.latitude = latitude;
		currentOptions.longitude = longitude;
		currentOptions.locationMode = "auto";

		elements.latitudeInput.value = latitude;
		elements.longitudeInput.value = longitude;
		updateLocationModeButtons();

		await writePersistentSettings({ latitude, longitude });
		await saveSettings({ latitude, longitude, locationMode: "auto" });
	} catch (error) {
		console.error("Geolocation failed", error);
		showStatus("Location unavailable");
	}
}

async function handleManualLocationSave() {
	const latitude = elements.latitudeInput.value.trim();
	const longitude = elements.longitudeInput.value.trim();

	if (!latitude || !longitude) {
		showStatus("Enter both coordinates");
		return;
	}

	currentOptions.latitude = latitude;
	currentOptions.longitude = longitude;
	currentOptions.locationMode = "manual";

	try {
		await writePersistentSettings({ latitude, longitude });
		await saveSettings({ latitude, longitude, locationMode: "manual" });
		updateLocationModeButtons();
	} catch (error) {
		console.error("Failed to save manual location", error);
		showStatus("Could not save location");
	}
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
