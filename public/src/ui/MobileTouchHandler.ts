export class MobileTouchHandler {
    app: any;

    constructor(app: any) {
        this.app = app;
    }

    setup() {
        // Only apply mobile touch handling on mobile devices
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        if (!isMobile) return;

        let touchStartY = 0;
        let touchStartTime = 0;
        let isScrolling = false;

        // Prevent overscroll on touch devices
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isScrolling = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            // Let modal overlays handle their own scrolling
            if (this.app.uiManager && this.app.uiManager.getState('portfolioIsVisible')) {
                const portfolioContent = document.querySelector('#portfolio-overlay .portfolio-content');
                if (portfolioContent) {
                    if (!portfolioContent.contains(e.target as Node)) {
                        e.preventDefault();
                    } else {
                        const currentY = e.touches[0].clientY;
                        const deltaY = currentY - touchStartY; // positive = dragging down (scrolling up)
                        const isAtTop = portfolioContent.scrollTop <= 0;
                        const isAtBottom = portfolioContent.scrollTop + portfolioContent.clientHeight >= portfolioContent.scrollHeight - 1;
                        
                        // Prevent scroll chaining if at boundary
                        if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
                            if (e.cancelable) e.preventDefault();
                        }
                    }
                }
                return;
            }
            
            // Allow places list sidebar to handle its own scrolling is now handled globally in UIManager.js

            const showcaseOverlay = document.getElementById('showcase-overlay');
            if (showcaseOverlay && showcaseOverlay.classList.contains('visible')) {
                return;
            }
            const photoModal = document.querySelector('.photo-modal-overlay, .photo-gallery-modal-overlay');
            if (photoModal) {
                return;
            }

            if (!isScrolling) {
                isScrolling = true;
            }

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            const currentScroll = window.pageYOffset;
            const maxScroll = this.app.scrollController.getMaxScroll();

            // Prevent overscroll at the top
            if (currentScroll <= 0 && deltaY > 0) {
                e.preventDefault();
                return false;
            }

            // Prevent overscroll at the bottom
            if (currentScroll >= maxScroll && deltaY < 0) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            // If it was a quick tap (not a scroll), allow it
            if (touchDuration < 200 && !isScrolling) {
                return;
            }

            // Ensure we don't end up in an overscroll state
            const currentScroll = window.pageYOffset;
            const maxScroll = this.app.scrollController.getMaxScroll();

            if (currentScroll < 0) {
                window.scrollTo(0, 0);
            } else if (currentScroll > maxScroll) {
                window.scrollTo(0, maxScroll);
            }
        }, { passive: true });

        console.log('Mobile touch handling setup complete');
    }
}
