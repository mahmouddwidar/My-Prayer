// Enhanced interaction scripts for minimalist welcome page
function openNewTab() {
    chrome.tabs?.create({ url: 'chrome://newtab/' }) || window.open('about:blank', '_blank');
}

// Feature card interactions
function initializeFeatureCards() {
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.animationDelay = `${0.1 * (index + 1)}s`;
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeFeatureCards();

    // Add click handler for CTA button
    const ctaButton = document.getElementById('openNewTab');
    if (ctaButton) {
        ctaButton.addEventListener('click', openNewTab);
    }
});