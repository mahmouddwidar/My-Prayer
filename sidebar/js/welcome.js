// Enhanced interaction scripts
function openNewTab() {
    chrome.tabs?.create({ url: 'chrome://newtab/' }) || window.open('about:blank', '_blank');
}

// Progress indicator animation
function animateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    let width = 0;
    const animate = () => {
        if (width < 100) {
            width += 0.5;
            progressBar.style.width = width + '%';
            requestAnimationFrame(animate);
        }
    };
    animate();
}

// Feature card interactions
function initializeFeatureCards() {
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.animationDelay = `${0.1 * (index + 1)}s`;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Step progression simulation
function simulateStepProgress() {
    const steps = document.querySelectorAll('.step-card');
    let currentStep = 0;

    const progressStep = () => {
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('completed');
            if (currentStep + 1 < steps.length) {
                steps[currentStep + 1].classList.add('active');
            }
            currentStep++;
        }
    };

    // Auto-progress for demo (remove in production)
    setInterval(progressStep, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    animateProgress();
    simulateStepProgress();
    initializeFeatureCards();

    // Remove pulse animation after interaction
    document.addEventListener('click', () => {
        document.querySelector('.pulse')?.classList.remove('pulse');
    });

    // Add click handler for CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', openNewTab);
    }
});