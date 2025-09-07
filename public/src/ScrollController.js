export class ScrollController {
    constructor() {
        this.maxScroll = this.calculateMaxScroll();
        this.updateMaxScroll();
        
        // Update max scroll on resize
        window.addEventListener('resize', () => {
            this.updateMaxScroll();
        });
    }

    calculateMaxScroll() {
        // Calculate the maximum scroll distance
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        return documentHeight - windowHeight;
    }

    updateMaxScroll() {
        this.maxScroll = this.calculateMaxScroll();
    }

    getScrollProgress() {
        if (this.maxScroll <= 0) {
            return 0;
        }
        
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        let progress = Math.min(Math.max(currentScroll / this.maxScroll, 0), 1);
        
        // Mobile-specific adjustments
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        if (isMobile) {
            // Account for mobile browser behavior where full scroll might not be achievable
            // If we're within 50px of the bottom, consider it 100%
            const remainingScroll = this.maxScroll - currentScroll;
            if (remainingScroll <= 50 && progress > 0.85) {
                progress = 1.0;
            }
            
            // Also boost progress slightly on mobile to compensate for UI bars
            progress = Math.min(progress * 1.05, 1.0);
        }
        
        return progress;
    }

    getScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }

    getMaxScroll() {
        return this.maxScroll;
    }
}
