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

	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(onSuccess, onError);
	} else {
		alert("Geolocation is not supported by your browser");
		console.error("Geolocation is not supported by your browser");
	}

	function onSuccess(position) {
		const { latitude, longitude } = position.coords;
		chrome.storage.local.set(
			{ latitude: latitude, longitude: longitude },
			() => {
				console.log("Location data saved");
			}
		);
	}

	function onError(error) {
		console.error("Error getting location:", error);
		console.log("Unable to retrieve your location");
	}

	let todayPrayerTimes;
	let todayDates;
	let todayTimings;

	// Listen for storage changes
	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (namespace === "local") {
			if (
				changes.timings ||
				changes.hijri_day ||
				changes.hijri_month ||
				changes.gregorian_day
			) {
				getAllTimings().then(() => {
					if (todayPrayerTimes && todayDates) {
						updatePrayerTimes(todayPrayerTimes);
						updateDates(todayDates);
					}
				});
			}
		}
	});

	async function getAllTimings() {
		try {
			const result = await chrome.storage.local.get(["timings"]);
			if (!result.timings) {
				console.error("No timings found in storage.");
				return;
			}
			const dates = await chrome.storage.local.get([
				"hijri_day",
				"hijri_month",
				"gregorian_day",
			]);
			todayTimings = result["timings"];
			todayDates = dates;
			const prayerTimesArray = createPrayerTimesArray(todayTimings);
			todayPrayerTimes = prayerTimesArray.map(prayer => ({
				name: prayer.name,
				time: convertTo12HourFormat(prayer.time)
			}));
		} catch (error) {
			console.error("Error getting timings:", error);
		}
	}

	// Initial load
	getAllTimings().then(() => {
		if (todayPrayerTimes && todayDates) {
			updatePrayerTimes(todayPrayerTimes);
			updateDates(todayDates);
		}
	});

	function updatePrayerTimes(prayerTimes) {
		const { nextPrayer, previousPrayer } = findNextPrayer(prayerTimes);

		document.getElementById(
			"previous-time"
		).textContent = `${previousPrayer.time}`;
		document.getElementById(
			"previousPrayer"
		).textContent = `${previousPrayer.name}`;
		document.getElementById("next-time").textContent = `${nextPrayer.time}`;
		document.getElementById("nextPrayer").textContent = `${nextPrayer.name}`;

		const progressBar = document.querySelector(".progress-bar");
		updateProgressBar(
			new Date(),
			parseTimeToDate(nextPrayer.time),
			parseTimeToDate(previousPrayer.time),
			progressBar
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
