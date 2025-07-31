import fetchCountry from "./api/fetchCountry.js";
import fetchTimes from "./api/fetchTimes.js";
import { 
	getMethodByCountry, 
	showPrayerNotification, 
	schedulePrayerAlarm, 
	scheduleDailyAlarm,
	getCurrentDateString,
	getNextMidnight,
	handleError
} from "./utils/common.js";

// Welcome page constants
const WELCOME_PAGE = "sidebar/welcome.html";
const MAIN_SIDEBAR = "sidebar/sidebar.html";

chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install" || details.reason === "update") {
		chrome.sidePanel.setOptions({ path: WELCOME_PAGE });
		chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
	}
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	const { path } = await chrome.sidePanel.getOptions({ tabId });
	if (path === WELCOME_PAGE) {
		chrome.sidePanel.setOptions({ path: MAIN_SIDEBAR });
	}
});

chrome.commands.onCommand.addListener((command) => {
	if (command === "open_popup") {
		chrome.action.openPopup();
	}
});

chrome.runtime.onInstalled.addListener(async (details) => {
	console.log("onInstalled Reason: ", details.reason);

	// Set default behavior for side panel
	await chrome.sidePanel.setPanelBehavior({
		openPanelOnActionClick: false,
	});

	scheduleDailyAlarm();

	if (Notification.permission !== "granted") {
		Notification.requestPermission((permission) => {
			if (permission === "granted") {
				console.log("Notification permission granted.");
			} else {
				console.log("Notification permission denied.");
			}
		});
	}
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name === "dailyPrayerUpdate") {
		console.log("Daily prayer time update triggered.");
		const currentDate = getCurrentDateString();
		await updateTimings(currentDate);

		await chrome.alarms.clear("dailyPrayerUpdate");
		scheduleDailyAlarm();
	} else if (alarm.name.startsWith("prayer-")) {
		const prayerName = alarm.name.replace("prayer-", "");
		const result = await chrome.storage.local.get("options");
		if (result.options?.notification) {
			showPrayerNotification(prayerName);
		}
	}
});

// scheduleDailyAlarm function moved to utils/common.js

const currentDate = getCurrentDateString();

async function updateTimings(currentDate) {
	try {
		await fetchPrayerTimes(currentDate);

		const result = await chrome.storage.local.get(["timings", "options"]);
		const prayerTimes = result.timings;
		const notificationEnabled = result.options?.notification !== false;

		if (!prayerTimes) {
			throw new Error("Prayer timings not found in storage.");
		}

		if (notificationEnabled) {
			const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
			prayers.forEach((prayer) => {
				if (prayerTimes[prayer]) {
					const [hours, minutes] = prayerTimes[prayer].split(":").map(Number);
					const prayerTime = new Date();
					prayerTime.setHours(hours, minutes, 0, 0);

					if (prayerTime.getTime() > Date.now()) {
						schedulePrayerAlarm(prayer, prayerTime.getTime());
					} else {
						console.warn(
							`Skipping past prayer time for ${prayer}: ${prayerTime}`
						);
					}
				} else {
					console.warn(`Prayer time not available for ${prayer}`);
				}
			});
		}

		console.log("Prayer times updated. Notifications:", notificationEnabled);
	} catch (error) {
		console.error("Failed to update prayer timings:", error);
	}
}

// schedulePrayerAlarm function moved to utils/common.js

// showPrayerNotification function moved to utils/common.js

function fetchPrayerTimes(currentDate) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(["latitude", "longitude"], (result) => {
			if (result.latitude && result.longitude) {
				fetchCountry(result.latitude, result.longitude)
					.then((countryCode) => {
						return fetchTimes(
							result.latitude,
							result.longitude,
							getMethodByCountry(countryCode)
						);
					})
					.then(() => {
						chrome.storage.local.set({ lastUpdated: currentDate }, resolve);
					})
					.catch((error) => {
						console.error("Error updating timings: ", error);
						reject(error);
					});
			} else {
				console.log("No location data found");
				reject(new Error("No location data found"));
			}
		});
	});
}

// getMethodByCountry function moved to utils/common.js

function checkAndUpdateTimings() {
	chrome.storage.local.get(["lastUpdated"], (result) => {
		const currentDate = new Date();
		const lastUpdatedDate = new Date(result.lastUpdated);
		if (currentDate.getDate() !== lastUpdatedDate.getDate()) {
			fetchPrayerTimes(getCurrentDateString());
		}
	});
}

async function setNotificationMode(notificationMode) {
	try {
		if (notificationMode) {
			await updateTimings(currentDate);

			// Wait a moment to ensure storage is updated
			await new Promise((resolve) => setTimeout(resolve, 500));

			const result = await chrome.storage.local.get("timings");
			if (!result.timings) {
				console.log("⏳ Waiting for prayer times to be available...");
				await new Promise((resolve) => setTimeout(resolve, 5000));
				const retryResult = await chrome.storage.local.get("timings");
				if (!retryResult.timings) {
					throw new Error("No prayer times available after retry");
				}
				result.timings = retryResult.timings;
			}

			// Set up prayer alarms
			const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
			let alarmsSet = 0;

			prayers.forEach((prayer) => {
				if (result.timings[prayer]) {
					const [hours, minutes] = result.timings[prayer]
						.split(":")
						.map(Number);
					const prayerTime = new Date();
					prayerTime.setHours(hours, minutes, 0, 0);

					if (prayerTime.getTime() > Date.now()) {
						schedulePrayerAlarm(prayer, prayerTime.getTime());
						alarmsSet++;
						console.log(
							`✅ Alarm set for ${prayer} at ${prayerTime.toLocaleTimeString()}`
						);
					} else {
						console.warn(
							`⚠️ Skipping past prayer time for ${prayer}: ${prayerTime.toLocaleTimeString()}`
						);
					}
				}
			});

			const allAlarms = await chrome.alarms.getAll();
			console.log(`📅 Total alarms set: ${alarmsSet}`);
			console.log("🔔 Current alarms:", allAlarms);

			if (Notification.permission !== "granted") {
				await Notification.requestPermission();
			}

			console.log("✅ Notifications enabled and alarms set");
		} else {
			const allAlarms = await chrome.alarms.getAll();

			// Filter out only prayer alarms (excluding the daily update alarm)
			const prayerAlarms = allAlarms.filter(
				(alarm) =>
					alarm.name.startsWith("prayer-") && alarm.name !== "dailyPrayerUpdate"
			);

			console.log(
				"🗑️ Clearing prayer alarms:",
				prayerAlarms.map((p) => p.name)
			);
			console.log("📅 Preserving daily update alarm");

			// Clear only prayer alarms
			for (const alarm of prayerAlarms) {
				await chrome.alarms.clear(alarm.name);
			}

			const remainingAlarms = await chrome.alarms.getAll();
			console.log("🔔 Remaining alarms:", remainingAlarms);
			console.log("✅ Notifications disabled and prayer alarms cleared");
		}
	} catch (error) {
		console.error("❌ Error setting notification mode:", error);
		// If there's an error, we should still ensure the daily update alarm is set
		const hasDailyAlarm = await chrome.alarms.get("dailyPrayerUpdate");
		if (!hasDailyAlarm) {
			console.log("📅 Setting up daily update alarm");
			scheduleDailyAlarm();
		}
	}
}

function toggleNotificationBtn() {
	chrome.storage.onChanged.addListener((changes, area) => {
		if (area === "local" && changes.options?.newValue) {
			console.log("changes", changes);
			const notificationMode = Boolean(changes.options.newValue.notification);
			setNotificationMode(notificationMode);
		}
	});
}

setInterval(checkAndUpdateTimings, 1000);

async function init() {
	try {
		const result = await chrome.storage.local.get(["options", "timings"]);
		const options = result.options || {};

		if (options.notification === undefined) {
			options.notification = true;
			await chrome.storage.local.set({ options });
		}

		if (!result.timings) {
			await updateTimings(currentDate);
		}

		await setNotificationMode(options.notification);
		toggleNotificationBtn();

		if (options.notification && Notification.permission !== "granted") {
			Notification.requestPermission();
		}
	} catch (error) {
		console.error("Initialization failed:", error);
	}
}

init();
