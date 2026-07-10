export class ScrollController {
    maxScroll: number;

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
            // Boost progress slightly on mobile to compensate for UI bars
            progress = Math.min(progress * 1.08, 1.0);
            
            // Account for mobile browser behavior where full scroll might not be achievable
            // But ensure gradual increase for fade animations to work properly
            const remainingScroll = this.maxScroll - currentScroll;
            if (remainingScroll <= 30 && progress > 0.88) {
                // Gradually approach 1.0 instead of jumping to it
                const nearBottomProgress = 1.0 - (remainingScroll / 30) * 0.12;
                progress = Math.max(progress, nearBottomProgress);
            }
        } else {
            // For desktop, ensure we reach exactly 1.0 at the very bottom
            // Floating point or minor subpixel scroll issues can prevent it
            const remainingScroll = this.maxScroll - currentScroll;
            if (remainingScroll <= 20 && progress > 0.95) {
                const nearBottomProgress = 1.0 - (remainingScroll / 20) * 0.05;
                progress = Math.max(progress, nearBottomProgress);
            }
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
