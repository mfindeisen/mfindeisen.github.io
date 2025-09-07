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
        if (this.maxScroll <= 0) return 0;
        
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const progress = Math.min(Math.max(currentScroll / this.maxScroll, 0), 1);
        
        return progress;
    }

    getScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }

    getMaxScroll() {
        return this.maxScroll;
    }
}
