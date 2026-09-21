const CACHE_KEY = "myPrayerTheme";
const root = document.documentElement;
const media = matchMedia("(prefers-color-scheme: dark)");
let current = "system";

function apply(theme) {
	current = theme || "system";
	root.dataset.theme =
		current === "system" ? (media.matches ? "dark" : "light") : current;
}

apply(localStorage.getItem(CACHE_KEY));

chrome.storage.local.get("options").then(({ options }) => {
	const theme = options?.theme || "system";
	localStorage.setItem(CACHE_KEY, theme);
	apply(theme);
});

chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "local" && changes.options) {
		const theme = changes.options.newValue?.theme || "system";
		localStorage.setItem(CACHE_KEY, theme);
		apply(theme);
	}
});

media.addEventListener("change", () => {
	if (current === "system") apply("system");
});