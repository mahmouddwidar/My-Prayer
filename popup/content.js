document.addEventListener("DOMContentLoaded", () => {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(onSuccess, onError);
	} else {
		alert("Geolocation is not supported by your browser");
	}

	const today = new Date();
	const dd = String(today.getDate()).padStart(2, "0");
	const mm = String(today.getMonth() + 1).padStart(2, "0");
	const yyyy = today.getFullYear();
	const formattedDate = yyyy + "-" + mm + "-" + dd;

	setInterval(() => {
		let date1 = new Date(formattedDate);
		let date2 = new Date(localStorage.getItem("lastUpdatedDate"));

		if (date1.getTime() < date2.getTime()) {
			fetchPrayerTimes(latitude, longitude, method);
			localStorage.setItem("lastUpdatedDate", formattedDate);
			console.log("timings updated");
		}
	}, 60000);

	function onSuccess(position) {
		const { latitude, longitude } = position.coords;
		fetchCountry(latitude, longitude)
			.then((countryCode) => {
				const method = getMethodByCountry(countryCode);

				if (localStorage.getItem("prayerTimes")) {
					updatePrayerTimesFromLocalStorage();
					let dates = JSON.parse(localStorage.getItem("date"));
					updateDates(dates.day, dates.dayDate, dates.month);

					setInterval(() => {
						updatePrayerTimesFromLocalStorage();
					}, 1000);
				} else {
					fetchPrayerTimes(latitude, longitude, method);
					localStorage.setItem("lastUpdatedDate", formattedDate);
				}
			})
			.catch((error) => {
				console.error("Error getting country:", error);
				alert("Unable to determine your country");
			});
	}

	function onError(error) {
		console.error("Error getting location:", error);
		alert("Unable to retrieve your location");
	}

	function fetchCountry(latitude, longitude) {
		const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
		return fetch(url)
			.then((response) => response.json())
			.then((data) => data.countryCode)
			.catch((error) => {
				console.error("Error fetching country data:", error);
				throw error;
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

	function fetchPrayerTimes(latitude, longitude, method) {
		const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
		fetch(url)
			.then((response) => response.json())
			.then((data) => {
				const timings = data.data.timings;
				const hijriDate = data.data.date.hijri;

				const currentTime = new Date();
				const prayerTimes = [
					{ name: "Fajr", time: convertTo12HourFormat(timings.Fajr) },
					{ name: "Sunrise", time: convertTo12HourFormat(timings.Sunrise) },
					{ name: "Dhuhr", time: convertTo12HourFormat(timings.Dhuhr) },
					{ name: "Asr", time: convertTo12HourFormat(timings.Asr) },
					{ name: "Maghrib", time: convertTo12HourFormat(timings.Maghrib) },
					{ name: "Isha", time: convertTo12HourFormat(timings.Isha) },
				];

				// Convert prayer times to Date objects for comparison
				prayerTimes.forEach((prayer) => {
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

				localStorage.setItem("prayerTimes", JSON.stringify(prayerTimes));
				localStorage.setItem(
					"date",
					JSON.stringify({
						day: data.data.date.gregorian.weekday.en,
						dayDate: hijriDate.day,
						month: hijriDate.month.en,
					})
				);

				updatePrayerTimesFromLocalStorage();

				setInterval(() => {
					updatePrayerTimesFromLocalStorage();
				}, 1000);

				updateDates(
					data.data.date.gregorian.weekday.en,
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
		updatePrayerTimes(prayerTimes);
	}

	function updatePrayerTimes(prayerTimes) {
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
			new Date(nextPrayer.date),
			new Date(previousPrayer.date)
		);
	}

	function updateProgressBar(currentTime, nextPrayerTime, previousPrayerTime) {
		const timeDiff = nextPrayerTime - currentTime;
		const totalTime = Math.abs(nextPrayerTime - previousPrayerTime);

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
