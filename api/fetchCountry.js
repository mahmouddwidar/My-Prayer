export default function fetchCountry(latitude, longitude) {
	const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
	return fetch(url)
		.then((response) => response.json())
		.then((data) => {
			return data.countryCode;
		})
		.catch((error) => {
			console.error("Error fetching country data:", error);
			throw error;
		});
}
