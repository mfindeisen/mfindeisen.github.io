/**
 * UIManager - Handles general UI state and interactions
 */
export class UIManager {
    constructor(placesManager = null) {
        this.elements = {
            container: document.getElementById('canvas-container'),
            scrollProgress: document.getElementById('scroll-progress'),
            googleEarthContainer: document.getElementById('google-earth-container'),
            scrollIndicator: document.getElementById('scroll-indicator'),
            portfolioOverlay: document.getElementById('portfolio-overlay'),
            skipButton: document.getElementById('skip-button'),
            skipShowcaseBtn: document.getElementById('skip-showcase-btn'),
            reopenPortfolioBtn: document.getElementById('reopen-portfolio-btn'),
            reopenShowcaseBtn: document.getElementById('reopen-showcase-btn'),
            showcaseOverlay: document.getElementById('showcase-overlay'),
            backToBeginningBtn: document.getElementById('back-to-beginning-btn'),
            footer: document.getElementById('footer')
        };
        
        this.state = {
            hasCompletedMapJourney: false,
            portfolioHasBeenShown: false,
            portfolioManuallyDismissed: false,
            hasZoomedToErbil: false,
            isScrollLocked: false,
            isAutoScrolling: false,
            activeOverlay: 'none', // 'none' | 'portfolio' | 'showcase'
            journeyState: 'idle' // 'idle' | 'scrolling' | 'flying' | 'arrived'
        };

        this.lastOverlayToggleTime = 0;
        this.setupOverlayListeners();
        
        this.beginningTimer = null;
        this.autoScrollAnimation = null;
        this.scrollPosition = 0;
        this.preventScrollKeys = null;
        this.placesManager = placesManager;

        // Global scroll interceptor to prevent UI overlays from scrolling the document in map view
        const preventOverlayScroll = (e) => {
            // Only apply if map view is active (heuristic: check if scroll is near bottom)
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const maxScroll = documentHeight - windowHeight;
            if (maxScroll <= 0) return;
            
            const currentScroll = window.pageYOffset;
            const scrollProgress = currentScroll / maxScroll;
            
            if (scrollProgress > 0.5) {
                // If it's a UI element (not the actual map canvas and not the earth canvas)
                const isMapCanvas = e.target.closest('.maplibregl-canvas');
                const isEarthCanvas = e.target.closest('#canvas-container');
                
                if (!isMapCanvas && !isEarthCanvas) {
                    // Check if it's inside a scrollable container
                    const scrollable = e.target.closest('.portfolio-content, .places-list, .photo-modal-content, .maplibregl-popup-content');
                    if (scrollable) {
                        const deltaY = e.type === 'wheel' ? e.deltaY : (this.lastTouchY ? this.lastTouchY - e.touches[0].clientY : 0);
                        const isAtTop = scrollable.scrollTop <= 0;
                        const isAtBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
                        
                        if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
                            if (e.cancelable) e.preventDefault();
                        }
                    } else {
                        // Not a scrollable container, prevent document scrolling
                        if (e.cancelable) e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('wheel', preventOverlayScroll, { passive: false });
        window.addEventListener('touchmove', preventOverlayScroll, { passive: false });
        
        window.addEventListener('touchstart', (e) => {
            this.lastTouchY = e.touches[0].clientY;
        }, { passive: true });
    }

    setupOverlayListeners() {
        const overlays = ['portfolio', 'showcase'];
        overlays.forEach(overlayName => {
            const overlay = this.getElement(`${overlayName}Overlay`);
            if (!overlay) return;

            // Handle close button click
            // Both overlays use the .close-portfolio class for their close buttons
            const closeBtn = overlay.querySelector('.close-portfolio');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (Date.now() - this.lastOverlayToggleTime < 500) return;
                    this.setActiveOverlay('none');
                });
            }

            // Handle background click (clicking outside the content)
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    if (Date.now() - this.lastOverlayToggleTime < 500) return;
                    this.setActiveOverlay('none');
                }
            });
        });
    }

    // Element getters
    getElement(name) {
        return this.elements[name];
    }

    // State management
    setState(key, value) {
        this.state[key] = value;
    }

    getState(key) {
        return this.state[key];
    }

    // Set places manager reference
    setPlacesManager(placesManager) {
        this.placesManager = placesManager;
    }

    // UI visibility controls
    showElement(elementName, className = 'visible') {
        const element = this.elements[elementName];
        if (element) {
            element.classList.add(className);
            element.classList.remove('hidden');
        }
    }

    hideElement(elementName, className = 'hidden') {
        const element = this.elements[elementName];
        if (element) {
            element.classList.add(className);
            element.classList.remove('visible');
        }
    }

    toggleElement(elementName, showClass = 'visible', hideClass = 'hidden') {
        const element = this.elements[elementName];
        if (element) {
            if (element.classList.contains(showClass)) {
                this.hideElement(elementName, hideClass);
            } else {
                this.showElement(elementName, showClass);
            }
        }
    }

    // Scroll management
    lockScroll() {
        if (this.state.isScrollLocked) {
            console.log('Scroll is already locked, ignoring lockScroll() to prevent losing scrollPosition.');
            return;
        }

        this.setState('isScrollLocked', true);
        this.scrollPosition = window.pageYOffset;
        
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        
        this.preventScrollKeys = (e) => {
            if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        };
        
        document.addEventListener('keydown', this.preventScrollKeys, { passive: false });
        console.log('Background scroll locked');
    }

    unlockScroll() {
        this.setState('isScrollLocked', false);
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        if (this.preventScrollKeys) {
            document.removeEventListener('keydown', this.preventScrollKeys);
            this.preventScrollKeys = null;
        }
        
        // Only restore scroll position if we're not in the MapTiler view
        // If we're in the MapTiler view (scroll progress > 0.5), stay at current position
        const currentScroll = window.pageYOffset;
        
        // We need to calculate scroll progress, but we don't have access to scrollController
        // So we'll use a simple heuristic: if we're near the bottom of the page, don't restore
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const maxScroll = documentHeight - windowHeight;
        const scrollProgress = maxScroll > 0 ? currentScroll / maxScroll : 0;
        
        console.log('🔵 UIManager unlockScroll() - scroll progress:', scrollProgress, 'current scroll:', currentScroll, 'stored scroll:', this.scrollPosition);
        
        if (scrollProgress <= 0.5) {
            // Restore scroll position only if we're not in the MapTiler view
            // If stored scroll position is undefined, use current position
            const targetScroll = this.scrollPosition !== undefined ? this.scrollPosition : currentScroll;
            console.log('🔵 UIManager unlockScroll() - restoring scroll to:', targetScroll);
            window.scrollTo(0, targetScroll);
        } else {
            console.log('🔵 UIManager unlockScroll() - staying at current position:', currentScroll, '(MapTiler view)');
        }
        
        console.log('Background scroll unlocked');
    }

    // Auto-scroll functionality
    startAutoScroll() {
        if (this.state.isAutoScrolling) return;
        
        console.log('Starting auto-scroll animation');
        this.setState('isAutoScrolling', true);
        
        this.showElement('scrollIndicator', 'animating');
        this.hideElement('skipButton');
        this.hideElement('skipShowcaseBtn');
        this.hideElement('footer');
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const duration = 12000;
        const startTime = Date.now();
        const startScroll = window.pageYOffset;
        
        const progressFill = document.querySelector('.progress-fill');
        
        const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progressFill) {
                progressFill.style.width = `${progress * 100}%`;
            }
            
            const easeProgress = this.easeInOutQuart(progress);
            const currentScroll = startScroll + (maxScroll - startScroll) * easeProgress;
            
            window.scrollTo(0, currentScroll);
            
            if (progress < 1) {
                this.autoScrollAnimation = requestAnimationFrame(animateScroll);
            } else {
                this.completeAutoScroll();
            }
        };
        
        this.autoScrollAnimation = requestAnimationFrame(animateScroll);
    }

    completeAutoScroll() {
        console.log('Auto-scroll animation completed');
        this.setState('isAutoScrolling', false);
        
        this.hideElement('scrollIndicator');
        this.showElement('scrollIndicator', 'animating');
        
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        if (this.autoScrollAnimation) {
            cancelAnimationFrame(this.autoScrollAnimation);
            this.autoScrollAnimation = null;
        }
    }

    // State Machine Overlay Controller
    setActiveOverlay(overlayName) {
        console.log(`Setting active overlay from '${this.state.activeOverlay}' to '${overlayName}'`);
        
        // Hide currently active overlay if any
        if (this.state.activeOverlay === 'portfolio') {
            this.hideElement('portfolioOverlay');
            this.setState('portfolioManuallyDismissed', true);
        } else if (this.state.activeOverlay === 'showcase') {
            this.hideElement('showcaseOverlay');
        }

        this.lastOverlayToggleTime = Date.now();
        this.setState('activeOverlay', overlayName);

        if (overlayName === 'none') {
            this.unlockScroll();
            
            // Restore UI based on journey state
            if (this.getState('journeyState') === 'arrived') {
                
                // Show Reopen Portfolio & Showcase buttons if manually dismissed
                if (this.getState('portfolioHasBeenShown') && this.getState('portfolioManuallyDismissed')) {
                    this.showElement('reopenPortfolioBtn');
                    this.showElement('reopenShowcaseBtn');
                }
                // We are at the map (arrived), so unconditionally restore MapTiler map
                const googleEarthContainer = this.getElement('googleEarthContainer');
                if (googleEarthContainer) {
                    googleEarthContainer.style.opacity = '1';
                    googleEarthContainer.style.zIndex = '2';
                    googleEarthContainer.classList.add('visible');
                }
                
                if (this.placesManager) {
                    this.placesManager.setPlacesListVisibility(true);
                }
            } else {
                // If we are not arrived (e.g. at the top of the page), restore the top buttons
                // Only if we haven't scrolled down
                if (window.pageYOffset <= 50) {
                    this.showElement('scrollIndicator');
                    this.showElement('skipButton');
                    this.showElement('skipShowcaseBtn');
                    this.showElement('footer');
                }
            }
        } else {
            // An overlay is active, lock the UI
            this.lockScroll();
            this.hideElement('reopenPortfolioBtn');
            this.hideElement('backToBeginningBtn');
            this.hideElement('skipShowcaseBtn');
            this.hideElement('reopenShowcaseBtn');
            
            if (this.placesManager) {
                this.placesManager.setPlacesListVisibility(false);
            }
            
            // Hide MapTiler map underneath to avoid pointer-events conflicts
            const googleEarthContainer = this.getElement('googleEarthContainer');
            if (googleEarthContainer) {
                googleEarthContainer.style.opacity = '0';
                googleEarthContainer.style.zIndex = '0';
                googleEarthContainer.classList.remove('visible');
            }

            if (overlayName === 'portfolio') {
                this.showElement('portfolioOverlay');
                const content = this.getElement('portfolioOverlay')?.querySelector('.portfolio-content');
                if (content) {
                    content.scrollTop = 0;
                }
            } else if (overlayName === 'showcase') {
                this.showElement('showcaseOverlay');
                const content = this.getElement('showcaseOverlay')?.querySelector('.portfolio-content');
                if (content) {
                    content.scrollTop = 0;
                }
            }
        }
    }

    // Beginning state management
    checkBeginningState(progress) {
        if (this.getState('portfolioIsVisible') || this.getState('showcaseIsVisible')) {
            return;
        }

        if (progress < 0.005) {
            if (!this.state.isAtBeginning) {
                this.setState('isAtBeginning', true);
                this.beginningTimer = setTimeout(() => {
                    if (this.state.isAtBeginning && progress < 0.005) {
                        this.setState('portfolioHasBeenShown', false);
                        this.setState('portfolioManuallyDismissed', false);
                        console.log('Reset portfolio flags - user wants fresh start');
                    }
                }, 3000);
            }
        } else if (progress >= 0.01) {
            this.setState('isAtBeginning', false);
            if (this.beginningTimer) {
                clearTimeout(this.beginningTimer);
                this.beginningTimer = null;
            }
        }
    }

    // Utility functions
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    // Cleanup
    destroy() {
        if (this.autoScrollAnimation) {
            cancelAnimationFrame(this.autoScrollAnimation);
        }
        
        if (this.beginningTimer) {
            clearTimeout(this.beginningTimer);
        }
        
        if (this.preventScrollKeys) {
            document.removeEventListener('keydown', this.preventScrollKeys);
        }
    }
}
