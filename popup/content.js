document.addEventListener("DOMContentLoaded", () => {
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

	async function getAllTimings() {
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
		todayPrayerTimes = [
			{ name: "Fajr", time: convertTo12HourFormat(todayTimings.Fajr) },
			{ name: "Sunrise", time: convertTo12HourFormat(todayTimings.Sunrise) },
			{ name: "Dhuhr", time: convertTo12HourFormat(todayTimings.Dhuhr) },
			{ name: "Asr", time: convertTo12HourFormat(todayTimings.Asr) },
			{ name: "Maghrib", time: convertTo12HourFormat(todayTimings.Maghrib) },
			{ name: "Isha", time: convertTo12HourFormat(todayTimings.Isha) },
		];
	}

	getAllTimings().then(() => {
		updatePrayerTimes(todayPrayerTimes);
		updateDates(todayDates);
	});

	function updatePrayerTimes(prayerTimes) {
		const currentTime = new Date();
		let nextPrayer, previousPrayer;

		for (let i = 0; i < prayerTimes.length; i++) {
			const prayerDate = parseTimeToDate(
				prayerTimes[i].time,
				prayerTimes[i].name
			);
			if (currentTime < prayerDate) {
				nextPrayer = prayerTimes[i];
				previousPrayer =
					i === 0 ? prayerTimes[prayerTimes.length - 1] : prayerTimes[i - 1];
				break;
			}
		}

		if (!nextPrayer) {
			nextPrayer = prayerTimes[0];
			previousPrayer = prayerTimes[prayerTimes.length - 1];
		}

		document.getElementById(
			"previous-time"
		).textContent = `${previousPrayer.time}`;
		document.getElementById(
			"previousPrayer"
		).textContent = `${previousPrayer.name}`;
		document.getElementById("next-time").textContent = `${nextPrayer.time}`;
		document.getElementById("nextPrayer").textContent = `${nextPrayer.name}`;

		updateProgressBar(
			currentTime,
			parseTimeToDate(nextPrayer.time),
			parseTimeToDate(previousPrayer.time)
		);
	}

	function updateDates(dates) {
		document.getElementById("day").textContent = `${dates.gregorian_day}`;
		document.getElementById("date").textContent = `${dates.hijri_day}`;
		document.getElementById("month").textContent = `${dates.hijri_month}`;
	}

	function parseTimeToDate(time) {
		const [timeString, period] = time.split(" ");
		const [hours, minutes] = timeString.split(":");
		let hour = parseInt(hours);
		if (period === "PM" && hour !== 12) hour += 12;
		if (period === "AM" && hour === 12) hour = 0;

		const date = new Date();
		date.setHours(hour, parseInt(minutes), 0, 0);

		return date;
	}

	function convertTo12HourFormat(time24) {
		const [hours, minutes] = time24.split(":");
		let period = "AM";
		let hour = parseInt(hours);

		if (hour >= 12) {
			period = "PM";
		}
		if (hour === 0) {
			hour = 12;
		} else if (hour > 12) {
			hour -= 12;
		}

		return `${hour}:${minutes.padStart(2, "0")} ${period}`;
	}

	function updateProgressBar(currentTime, nextPrayerTime, previousPrayerTime) {
		let timeDiff = nextPrayerTime - currentTime;

		let totalTime = nextPrayerTime - previousPrayerTime;

		// Adjust totalTime for overnight prayer times
		if (totalTime < 0) {
			totalTime += 24 * 60 * 60 * 1000;
			if (currentTime > nextPrayerTime) {
				timeDiff += 24 * 60 * 60 * 1000;
				console.log("time diff updated.");
			}
		}

		const progressBar = document.querySelector(".progress-bar");
		const progressBarBackground = document.querySelector(".progress");
		const progress = 100 - (timeDiff / totalTime) * 100;

		progressBar.style.width = `${progress}%`;

		const totalSeconds = Math.floor(timeDiff / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);

		if (hours > 0) {
			progressBar.textContent = `${hours} hr ${minutes} min`;
			progressBar.setAttribute("title", `${hours} hr ${minutes} min`);
			progressBarBackground.setAttribute("title", `${hours} hr ${minutes} min`);
		} else {
			progressBar.textContent = `${minutes} min`;
			progressBar.setAttribute("title", `${minutes} min`);
			progressBarBackground.setAttribute("title", `${minutes} min`);
		}
	}

	// Notification Button
	const checkbox = document.getElementById("notification");

	// Load and apply the saved notification setting
	chrome.storage.local.get("options", (result) => {
		let options = result.options || {};

		if (options.notification === undefined) {
			options.notification = true; // Default Value
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
