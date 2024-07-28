import fetchCountry from "./api/fetchCountry.js";
import fetchTimes from "./api/fetchTimes.js";

chrome.commands.onCommand.addListener((command) => {
	if (command === "open_popup") {
		chrome.action.openPopup();
	}
});

chrome.runtime.onInstalled.addListener((details) => {
	console.log("onInstalled Reason: ", details.reason);
	updateTimings();
});

function updateTimings(currentDate) {
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
			updateTimings(currentDate.toDateString());
		}
	});
}

setInterval(checkAndUpdateTimings, 1000);
