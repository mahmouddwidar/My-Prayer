document.addEventListener("DOMContentLoaded", () => {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(onSuccess, onError);
	} else {
		console.log("Geolocation is not supported by your browser");
	}

	function onSuccess(position) {
		const { latitude, longitude } = position.coords;
		chrome.storage.local.set({ latitude: latitude, longitude: longitude }, () => {
			console.log("Location data saved");
		});
	}

	function onError(error) {
		console.error("Error getting location:", error);
		console.log("Unable to retrieve your location");
	}
	
	// chrome.storage.local.get("timings", (result) => {
    //     for (const [prayer, time] of Object.entries(result.timings)) {
	// 		console.log(`Prayer ${prayer}: ${time}`);
	// 	}
    // });
	
	chrome.storage.local.get("timings", (result) => {
        for (prayer of Object.entries(result.timings)) {
			console.log(`Prayer ${prayer}`);
		}
    });


/////////////////////////////////////////////////////////////////////////////////////////
	const today = new Date();
	const dd = String(today.getDate()).padStart(2, "0");
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const yyyy = today.getFullYear();
	const formattedDate = yyyy + "-" + mm + "-" + dd;

	setInterval(() => {
		let date1 = new Date(formattedDate);
		let date2 = new Date(localStorage.getItem("lastUpdatedDate"));

		if (date1.getTime() > date2.getTime()) {
			fetchPrayerTimes(latitude, longitude, method);
			localStorage.setItem("lastUpdatedDate", formattedDate);
			console.log("timings updated");
		}
	}, 60000);

	function fetchPrayerTimes(latitude, longitude, method) {
		const todayUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
		const tomorrowUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&date=tommorow`;

		Promise.all([fetch(todayUrl), fetch(tomorrowUrl)])
			.then(([todayResponse, tomorrowResponse]) => Promise.all([todayResponse.json(), tomorrowResponse.json()]))
			.then(([todayData, tomorrowData]) => {
				const todayTimings = todayData.data.timings;
				const tomorrowTimings = tomorrowData.data.timings;
				const hijriDate = todayData.data.date.hijri;

				const currentTime = new Date();
				const todayPrayerTimes = [
					{ name: "Fajr", time: convertTo12HourFormat(todayTimings.Fajr) },
					{ name: "Sunrise", time: convertTo12HourFormat(todayTimings.Sunrise) },
					{ name: "Dhuhr", time: convertTo12HourFormat(todayTimings.Dhuhr) },
					{ name: "Asr", time: convertTo12HourFormat(todayTimings.Asr) },
					{ name: "Maghrib", time: convertTo12HourFormat(todayTimings.Maghrib) },
					{ name: "Isha", time: convertTo12HourFormat(todayTimings.Isha) },
				];

				const nextFajrTime = convertTo12HourFormat(tomorrowTimings.Fajr);

				// Convert prayer times to Date objects for comparison
				todayPrayerTimes.forEach((prayer) => {
					const [time, period] = prayer.time.split(" ");
					const [hours, minutes] = time.split(":");
					let hour = parseInt(hours);
					if (period.toLowerCase() === "pm" && hour !== 12) {
						hour += 12;
					} else if (period.toLowerCase() === "am" && hour === 12) {
						hour = 0;
					}
					prayer.date = new Date(currentTime);
					prayer.date.setHours(hour);
					prayer.date.setMinutes(parseInt(minutes));
					prayer.date.setSeconds(0);
				});

				localStorage.setItem("prayerTimes", JSON.stringify(todayPrayerTimes));
				localStorage.setItem("nextFajr", JSON.stringify(nextFajrTime));
				localStorage.setItem(
					"date",
					JSON.stringify({
						day: todayData.data.date.gregorian.weekday.en,
						dayDate: hijriDate.day,
						month: hijriDate.month.en,
					})
				);

				updatePrayerTimesFromLocalStorage();

				setInterval(() => {
					updatePrayerTimesFromLocalStorage();
				}, 1000);

				updateDates(
					todayData.data.date.gregorian.weekday.en,
					hijriDate.day,
					hijriDate.month.en
				);
			})
			.catch((error) => console.error("Error fetching prayer times:", error));
	}

	function updateDates(day, date, month) {
		document.getElementById("day").textContent = day;
		document.getElementById("date").textContent = date;
		document.getElementById("month").textContent = month;
	}

	function updatePrayerTimesFromLocalStorage() {
		let prayerTimes = JSON.parse(localStorage.getItem("prayerTimes"));
		let nextFajrTime = JSON.parse(localStorage.getItem("nextFajr"));
		updatePrayerTimes(prayerTimes, nextFajrTime);
	}

	function updatePrayerTimes(prayerTimes, nextFajrTime) {
		const currentTime = new Date();

		let nextPrayer, previousPrayer;
		for (let i = 0; i < prayerTimes.length; i++) {
			if (currentTime < new Date(prayerTimes[i].date)) {
				nextPrayer = prayerTimes[i];
				previousPrayer =
					i === 0 ? prayerTimes[prayerTimes.length - 1] : prayerTimes[i - 1];
				break;
			}
		}

		// If the current prayer is Isha, set the next prayer to Fajr of the next day
		if (previousPrayer && previousPrayer.name === "Isha") {
			const [time, period] = nextFajrTime.split(" ");
			// console.log('time: ', time);
			// console.log('period: ', period);
			const [hours, minutes] = time.split(":");
			let hour = parseInt(hours);
			console.log(previousPrayer.time);
			// if (period.toLowerCase() === "pm" && hour !== 12) {
			// 	hour += 12;
			// } else if (period.toLowerCase() === "am" && hour === 12) {
			// 	hour = 0;
			// }
			nextPrayer = {
				name: "Fajr",
				time: nextFajrTime,
				date: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate() + 1, hour, minutes, 0)
			};
		}

		document.getElementById("previous-time").textContent = `${previousPrayer.time}`;
		document.getElementById("previousPrayer").textContent = `${previousPrayer.name}`;
		document.getElementById("next-time").textContent = `${nextPrayer.time}`;
		document.getElementById("nextPrayer").textContent = `${nextPrayer.name}`;

		updateProgressBar(
			currentTime,
			new Date(nextPrayer.date),
			new Date(previousPrayer.date)
		);
	}

	function updateProgressBar(currentTime, nextPrayerTime, previousPrayerTime) {
		const timeDiff = nextPrayerTime - currentTime;
		console.log(nextPrayerTime);
		let totalTime;

		if (nextPrayerTime < previousPrayerTime) {
			// Handles the case when the previous prayer was from the previous day
			totalTime = nextPrayerTime - previousPrayerTime + 22 * 60 * 60 * 1000;
		} else {
			totalTime = nextPrayerTime - previousPrayerTime;
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

		return `${hour}:${minutes} ${period}`;
	}
});
