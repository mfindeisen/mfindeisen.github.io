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
            // Nested scrollables must keep native touch scrolling. Calling preventDefault
            // here (especially while body is position:fixed for the map) freezes their scroll.
            const target = e.target;
            if (target instanceof Element) {
                const nestedScroll = target.closest(
                    '.places-list-container, .places-list, .photo-modal-overlay, .photo-gallery-modal-overlay, .portfolio-content'
                );
                if (nestedScroll) {
                    return;
                }
            }

            const activeOverlay = this.app.uiManager?.overlay;
            if (activeOverlay && activeOverlay !== 'none') {
                return;
            }

            // Journey/map scroll lock pins the body; pageYOffset stays 0 and would
            // otherwise treat every downward finger swipe as overscroll.
            if (this.app.uiManager?.isScrollLocked) {
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
