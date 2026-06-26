import {
	convertTo12HourFormat,
	parseTimeToDate,
	updateProgressBar,
	findNextPrayer,
	createPrayerTimesArray,
} from "../utils/common.js";

document.addEventListener("DOMContentLoaded", () => {
	// Add sidebar button functionality
	const sidebarBtn = document.getElementById("openSidebar");
	if (sidebarBtn) {
		sidebarBtn.addEventListener("click", async () => {
			try {
				// Get the current window
				const currentWindow = await chrome.windows.getCurrent();
				// Open the side panel in the current window
				await chrome.sidePanel.open({ windowId: currentWindow.id });
			} catch (error) {
				console.error("Error opening side panel:", error);
			}
		});
	}

	let todayPrayerTimes;
	let todayDates;
	let todayTimings;

	const errorCard = document.getElementById("errorCard");
	const errorMessage = document.getElementById("errorMessage");
	const openOptionsButton = document.getElementById("openOptionsButton");

	openOptionsButton?.addEventListener("click", () => {
		if (chrome.runtime?.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		}
	});

	function showError(message) {
		if (errorCard) {
			errorCard.classList.remove("hidden");
		}
		if (errorMessage) {
			errorMessage.textContent = message;
		}
	}

	function hideError() {
		if (errorCard) {
			errorCard.classList.add("hidden");
		}
	}

	function clearPrayerDisplay() {
		document.getElementById("previous-time").textContent = "—";
		document.getElementById("next-time").textContent = "—";
		document.getElementById("previousPrayer").textContent = "—";
		document.getElementById("nextPrayer").textContent = "—";
		const progressBar = document.querySelector(".progress-bar");
		if (progressBar) {
			progressBar.style.width = "0%";
			progressBar.textContent = "Waiting";
		}
	}

	async function loadPopupState() {
		try {
			const result = await chrome.storage.local.get([
				"timings",
				"hijri_day",
				"hijri_month",
				"gregorian_day",
				"latitude",
				"longitude",
				"options",
			]);

			const latitude = result.latitude;
			const longitude = result.longitude;
			const timings = result.timings;
			const dates = result;
			const options = result.options || {};

			if (!latitude || !longitude) {
				showError(
					"No location configured. Open Options and select your city to display prayer times.",
				);
				clearPrayerDisplay();
				return;
			}

			if (!timings) {
				showError(
					options.city
						? `Location set to ${options.city}, ${options.country || ""}. Prayer timings are still loading.`
						: "Prayer timings are still loading. Please refresh from Options.",
				);
				clearPrayerDisplay();
				return;
			}

			hideError();

			todayTimings = timings;
			todayDates = dates;
			const prayerTimesArray = createPrayerTimesArray(todayTimings);
			todayPrayerTimes = prayerTimesArray.map((prayer) => ({
				name: prayer.name,
				time: convertTo12HourFormat(prayer.time),
			}));
			updatePrayerTimes(todayPrayerTimes);
			updateDates(todayDates);
		} catch (error) {
			console.error("Error loading popup state:", error);
			showError("Failed to load prayer data. Please try again.");
			clearPrayerDisplay();
		}
	}

	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (namespace === "local") {
			const relevantKeys = [
				"timings",
				"hijri_day",
				"hijri_month",
				"gregorian_day",
				"latitude",
				"longitude",
				"options",
			];
			if (Object.keys(changes).some((key) => relevantKeys.includes(key))) {
				loadPopupState();
			}
		}
	});

	// Initial load
	loadPopupState();

	function updatePrayerTimes(prayerTimes) {
		const { nextPrayer, previousPrayer } = findNextPrayer(prayerTimes);

		document.getElementById("previous-time").textContent =
			`${previousPrayer.time}`;
		document.getElementById("previousPrayer").textContent =
			`${previousPrayer.name}`;
		document.getElementById("next-time").textContent = `${nextPrayer.time}`;
		document.getElementById("nextPrayer").textContent = `${nextPrayer.name}`;

		const progressBar = document.querySelector(".progress-bar");
		updateProgressBar(
			new Date(),
			parseTimeToDate(nextPrayer.time),
			parseTimeToDate(previousPrayer.time),
			progressBar,
		);
	}

	function updateDates(dates) {
		document.getElementById("day").textContent = `${dates.gregorian_day}`;
		document.getElementById("date").textContent = `${dates.hijri_day}`;
		document.getElementById("month").textContent = `${dates.hijri_month}`;
	}

	// parseTimeToDate, convertTo12HourFormat, and updateProgressBar functions moved to utils/common.js

	// Notification Button
	const checkbox = document.getElementById("notification");

	// Load and apply the saved notification setting
	chrome.storage.local.get("options", (result) => {
		let options = result.options || {};

		if (options.notification === undefined) {
			options.notification = false;
			chrome.storage.local.set({ options });
		}

		checkbox.checked = options.notification;
	});

	checkbox.addEventListener("change", async (e) => {
		const newValue = e.target.checked;
		await chrome.storage.local.set({ options: { notification: newValue } });
	});

	setInterval(() => {
		if (todayPrayerTimes && todayDates) {
			updatePrayerTimes(todayPrayerTimes);
			updateDates(todayDates);
		}
	}, 1000);
});
