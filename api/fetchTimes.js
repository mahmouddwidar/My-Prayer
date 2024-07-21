export default function fetchTimes(latitude, longitude, method) {
	const todayUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
	return fetch(todayUrl)
		.then((response) => response.json())
		.then((data) => {
			chrome.storage.local.set({ timings: data.data.timings });
			chrome.storage.local.set({
				hijri_day: data.data.date.hijri.day,
				hijri_month: data.data.date.hijri.month.en,
				gregorian_day: data.data.date.gregorian.weekday.en,
			});
		})
		.catch((error) => {
			console.error("Error fetching country data: ", error);
			throw error;
		});
}
