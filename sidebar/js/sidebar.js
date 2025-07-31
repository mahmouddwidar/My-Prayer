import { morningAzkar, eveningAzkar } from "../../utils/azkar-content.js";
import { convertTo12HourFormat, createPrayerTimesArray } from "../../utils/common.js";

// Sidebar Initialization
document.addEventListener("DOMContentLoaded", () => {
	initializeSections();
	loadPrayerTimes();
	loadAzkar();
	initializeScrollToTop();
});

// Section Toggle Functionality with Local Storage
function initializeSections() {
	const sections = document.querySelectorAll(".section-header");

	// Load saved states
	const savedStates = JSON.parse(localStorage.getItem("sectionStates") || "{}");

	sections.forEach((section) => {
		const sectionId = section.id;
		const content = section.nextElementSibling;
		const toggleBtn = section.querySelector(".toggle-btn");

		if (savedStates[sectionId] === "collapsed") {
			content.classList.add("collapsed");
			toggleBtn.classList.add("collapsed");
		}

		section.addEventListener("click", () => {
			content.classList.toggle("collapsed");
			toggleBtn.classList.toggle("collapsed");

			const states = JSON.parse(localStorage.getItem("sectionStates") || "{}");
			states[sectionId] = content.classList.contains("collapsed")
				? "collapsed"
				: "open";
			localStorage.setItem("sectionStates", JSON.stringify(states));
		});
	});
}

// Prayer Times Functionality
async function loadPrayerTimes() {
	try {
		const result = await chrome.storage.local.get(["timings"]);
		if (!result.timings) {
			console.error("No prayer times found");
			return;
		}

		const prayerList = document.querySelector(".prayer-list");
		const prayers = createPrayerTimesArray(result.timings);

		const currentTime = new Date();
		let nextPrayerFound = false;

		prayers.forEach((prayer) => {
			const [hours, minutes] = prayer.time.split(":").map(Number);
			const prayerTime = new Date();
			prayerTime.setHours(hours, minutes, 0, 0);

			const isNextPrayer = !nextPrayerFound && prayerTime > currentTime;
			if (isNextPrayer) {
				nextPrayerFound = true;
			}

			const prayerItem = document.createElement("div");
			prayerItem.className = `prayer-item ${isNextPrayer ? "active" : ""}`;
			prayerItem.innerHTML = `
                <span class="prayer-name">${prayer.name}</span>
                <span class="prayer-time">${convertTo12HourFormat(
				prayer.time
			)}</span>
            `;
			prayerList.appendChild(prayerItem);
		});
	} catch (error) {
		console.error("Error loading prayer times:", error);
	}
}

// Load Azkar Functionality
function loadAzkar() {
	// Load morning azkar
	const morningContainer = document.getElementById("morningAzkar");

	morningAzkar.forEach((azkar) => {
		const azkarItem = createAzkarItem(azkar);
		morningContainer.appendChild(azkarItem);
	});

	// Load evening azkar
	const eveningContainer = document.getElementById("eveningAzkar");
	eveningAzkar.forEach((azkar) => {
		const azkarItem = createAzkarItem(azkar);
		eveningContainer.appendChild(azkarItem);
	});

	initializeTabs();
}

// Tab Switching Functionality
function initializeTabs() {
	const tabButtons = document.querySelectorAll(".tab-btn");
	const tabContents = document.querySelectorAll(".tab-content");

	const activeTab = document.querySelector(".tab-btn.active");
	if (activeTab) {
		const tabId = activeTab.getAttribute("data-tab");
		document.getElementById(`${tabId}Azkar`).classList.add("active");
	}

	tabButtons.forEach((button) => {
		button.addEventListener("click", () => {
			tabButtons.forEach((btn) => btn.classList.remove("active"));
			tabContents.forEach((content) => content.classList.remove("active"));

			button.classList.add("active");
			const tabId = button.getAttribute("data-tab");
			const targetContent = document.getElementById(`${tabId}Azkar`);
			if (targetContent) {
				targetContent.classList.add("active");
			}
		});
	});
}

// Counter Functions
function createAzkarItem(azkar) {
	const div = document.createElement("div");
	div.className = "azkar-item";
	div.innerHTML = `
		${azkar.subtitle ? `<p class="azkar-subtitle">${azkar.subtitle}</p>` : ""}
        <p class="azkar-text">${azkar.text}</p>
		${azkar.fadl ? `<p class="azkar-fadl">${azkar.fadl}</p>` : ""}
        <div class="azkar-counter">
            <button class="reset-btn" title="Reset counter" onclick="resetCounter(this)">
                <svg viewBox="0 0 24 24" width="12" height="12">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" 
                    fill="currentColor"/>
                </svg>
            </button>
            <span class="counter-display" data-original="${azkar.count}">${azkar.count
		}</span>
        </div>
    `;

	const counterDisplay = div.querySelector(".azkar-counter");
	counterDisplay.addEventListener("click", function () {
		decrementCounter(this);
	});

	const resetBtn = div.querySelector(".reset-btn");
	resetBtn.addEventListener("click", function (e) {
		e.stopPropagation();
		resetCounter(this);
	});

	return div;
}

function decrementCounter(element) {
	const currentCount = parseInt(
		element.querySelector(".counter-display").textContent
	);
	if (currentCount > 0) {
		const newCount = currentCount - 1;
		element.querySelector(".counter-display").textContent = newCount;
		if (newCount === 0) {
			element.classList.add("disabled");
		}
	}
}

function resetCounter(button) {
	const counterDisplay = button.parentElement.querySelector(".counter-display");
	const originalCount = parseInt(counterDisplay.getAttribute("data-original"));
	counterDisplay.textContent = originalCount;
	button.parentElement.classList.remove("disabled");
}

// convertTo12HourFormat function moved to utils/common.js

// Scroll to Top Functionality
function initializeScrollToTop() {
	const scrollToTopBtn = document.getElementById('scrollToTop');

	// Show/hide button based on scroll position
	function toggleScrollButton() {
		if (window.scrollY > 300) {
			scrollToTopBtn.classList.add('visible');
		} else {
			scrollToTopBtn.classList.remove('visible');
		}
	}

	// Scroll to top when button is clicked
	scrollToTopBtn.addEventListener('click', () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});

	// Listen for scroll events
	window.addEventListener('scroll', toggleScrollButton);
}
