import fetchCountry from "./api/fetchCountry.js";
import fetchTimes from "./api/fetchTimes.js";

chrome.commands.onCommand.addListener((command) => {
	if (command === "open_popup") {
		chrome.action.openPopup();
	}
});

chrome.runtime.onInstalled.addListener((details) => {
	console.log("onInstalled Reason: ", details.reason);

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

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === "dailyPrayerUpdate") {
		console.log("Daily prayer time update triggered.");
		const currentDate = new Date().toDateString();
		updateTimings(currentDate)
			.then(() => {
				console.log("Prayer times updated successfully.");
			})
			.catch((error) => {
				console.error("Error updating prayer times:", error);
			});
	} else if (alarm.name.startsWith("prayer-")) {
		const prayerName = alarm.name.replace("prayer-", "");
		showPrayerNotification(prayerName);
	}
});

//     if (alarm.name === "dailyPrayerUpdate") {
//         console.log("Daily prayer time update triggered.");
//         const currentDate = new Date().toDateString();
//         updateTimings(currentDate)
//             .then(() => {
//                 console.log("Prayer times updated successfully.");
//             })
//             .catch((error) => {
//                 console.error("Error updating prayer times:", error);
//             });
//     }
// });

function scheduleDailyAlarm() {
	// Calculate time until midnight
	const now = new Date();
	const nextMidnight = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1,
		0,
		0,
		0,
		0
	);
	const timeUntilMidnight = nextMidnight - now;

	// Create an alarm to repeat every 24 hours starting at midnight
	chrome.alarms.create("dailyPrayerUpdate", {
		when: Date.now() + timeUntilMidnight,
		periodInMinutes: 24 * 60,
	});
}

async function updateTimings(currentDate) {
	try {
		await fetchPrayerTimes(currentDate);
		const result = await chrome.storage.local.get(["timings"]);
		const prayerTimes = result.timings;

		if (!prayerTimes) {
			throw new Error("Prayer timings not found in storage.");
		}

		const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

		prayers.forEach((prayer) => {
			if (prayerTimes[prayer]) {
				const prayerTime = new Date(`${currentDate} ${prayerTimes[prayer]}`);

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

		console.log("Prayer times updated and alarms set:", prayerTimes);
	} catch (error) {
		console.error("Failed to update prayer timings:", error);
	}
}

const currentDate = new Date().toDateString();
updateTimings(currentDate);

function schedulePrayerAlarm(prayer, timestamp) {
	chrome.alarms.create(`prayer-${prayer}`, { when: timestamp });
	console.log(`Alarm set for ${prayer} at ${new Date(timestamp)}`);
}

function showPrayerNotification(prayerName) {
	chrome.notifications.create({
		type: "basic",
		iconUrl: "./imgs/icon-64.png",
		title: "Prayer Reminder",
		message: `It's time for ${prayerName} prayer.`,
		priority: 2,
	});
}

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

function getMethodByCountry(countryCode) {
	const methods = {
		AE: 16,
		EG: 5,
		IN: 1,
		IQ: 3,
		IR: 7,
		KW: 9,
		MY: 3,
		PK: 1,
		QA: 10,
		SA: 4,
		SG: 11,
		TR: 13,
		US: 2,
		FR: 12,
		RU: 14,
	};
	return methods[countryCode] || 3; // Default to Muslim World League
}

function checkAndUpdateTimings() {
	chrome.storage.local.get(["lastUpdated"], (result) => {
		const currentDate = new Date();
		const lastUpdatedDate = new Date(result.lastUpdated);
		if (currentDate.getDate() !== lastUpdatedDate.getDate()) {
			fetchPrayerTimes(currentDate.toDateString());
		}
	});
}

setInterval(checkAndUpdateTimings, 1000);
