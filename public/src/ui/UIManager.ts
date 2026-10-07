import { prefersReducedMotion } from '../utils/motion.js';

/**
 * UIManager - Handles general UI state and interactions
 */
export class UIManager {
    elements: { [key: string]: HTMLElement | null };
    state: { [key: string]: any };
    lastOverlayToggleTime: number;
    beginningTimer: any;
    autoScrollAnimation: any;
    scrollPosition: number;
    preventScrollKeys: any;
    placesManager: any;
    lastTouchY: number;
    focusBeforeOverlay: HTMLElement | null = null;

    constructor(placesManager: any = null) {
        this.lastTouchY = 0;
        this.elements = {
            container: document.getElementById('canvas-container'),
            googleEarthContainer: document.getElementById('google-earth-container'),
            scrollIndicator: document.getElementById('scroll-indicator'),
            portfolioOverlay: document.getElementById('portfolio-overlay'),
            skipButton: document.getElementById('skip-button'),
            skipShowcaseBtn: document.getElementById('skip-showcase-btn'),
            reopenPortfolioBtn: document.getElementById('reopen-portfolio-btn'),
            reopenShowcaseBtn: document.getElementById('reopen-showcase-btn'),
            showcaseOverlay: document.getElementById('showcase-overlay'),
            backToBeginningBtn: document.getElementById('back-to-beginning-btn'),
            footer: document.getElementById('footer'),
            hero: document.getElementById('hero'),
            altPortfolioPage: document.getElementById('alt-portfolio-page')
        };
        
        this.state = {
            hasCompletedMapJourney: false,
            portfolioHasBeenShown: false,
            portfolioManuallyDismissed: false,
            hasZoomedToErbil: false,
            isScrollLocked: false,
            isAutoScrolling: false,
            activeOverlay: 'none', // 'none' | 'portfolio' | 'showcase'
            journeyState: 'idle', // 'idle' | 'scrolling' | 'flying' | 'arrived'
            isAltPortfolioActive: false
        };

        this.lastOverlayToggleTime = 0;
        this.setupOverlayListeners();
        this.setupOverlayToc(this.getElement('showcaseOverlay'));
        this.setupOverlayToc(this.getElement('portfolioOverlay'));
        
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
                    const scrollable = e.target.closest('.portfolio-content, .showcase-toc, .places-list, .photo-modal-content, .maplibregl-popup-content');
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

        document.addEventListener('keydown', (e) => {
            const overlay = this.getActiveOverlayElement();
            if (!overlay) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                this.setActiveOverlay('none');
            } else if (e.key === 'Tab') {
                this.trapFocus(overlay, e);
            }
        });
    }

    setupOverlayToc(overlay: HTMLElement | null) {
        if (!overlay) return;

        const content = overlay.querySelector<HTMLElement>('.portfolio-content');
        const toc = overlay.querySelector<HTMLElement>('.showcase-toc');
        if (!content || !toc) return;

        const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
        const sections = links
            .map((link) => {
                const id = link.getAttribute('href')?.slice(1);
                return id ? document.getElementById(id) : null;
            })
            .filter((section): section is HTMLElement => !!section);

        let currentId = '';
        let pinnedId = '';
        let pinTimer = 0;
        const revealActive = () => {
            if (toc.scrollWidth <= toc.clientWidth + 1) return;
            const activeLink = links.find((link) => link.getAttribute('aria-current') === 'true');
            if (!activeLink) return;
            const left = activeLink.offsetLeft - (toc.clientWidth - activeLink.offsetWidth) / 2;
            toc.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
        };

        const setCurrent = (id: string) => {
            if (id === currentId) return;
            currentId = id;
            for (const link of links) {
                const active = link.getAttribute('href') === `#${id}`;
                if (active) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            }
            revealActive();
        };

        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => revealActive()).observe(toc);
        }

        const sync = () => {
            if (pinnedId) return;
            const atBottom = content.scrollTop > 0
                && content.scrollTop + content.clientHeight >= content.scrollHeight - 4;
            if (atBottom && sections.length > 0) {
                setCurrent(sections[sections.length - 1].id);
                return;
            }
            const edge = content.getBoundingClientRect().top + 80;
            let current = sections[0];
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= edge) current = section;
            }
            if (current) setCurrent(current.id);
        };

        const releasePin = () => {
            window.clearTimeout(pinTimer);
            pinTimer = window.setTimeout(() => {
                pinnedId = '';
                sync();
            }, 80);
        };

        toc.addEventListener('click', (event) => {
            const link = (event.target as HTMLElement).closest('a');
            if (!link || !toc.contains(link)) return;
            const id = link.getAttribute('href')?.slice(1);
            if (!id) return;
            const target = document.getElementById(id);
            if (!target || !content.contains(target)) return;
            event.preventDefault();
            pinnedId = id;
            setCurrent(id);
            const top = target.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 68;
            content.scrollTo({
                top: Math.max(0, top),
                behavior: prefersReducedMotion() ? 'auto' : 'smooth'
            });
            window.clearTimeout(pinTimer);
            pinTimer = window.setTimeout(() => {
                pinnedId = '';
                sync();
            }, 1200);
        });

        content.addEventListener('scroll', () => {
            if (pinnedId) {
                releasePin();
                return;
            }
            sync();
        }, { passive: true });
        sync();
    }

    getActiveOverlayElement(): HTMLElement | null {
        const name = this.state.activeOverlay;
        return name === 'none' ? null : this.getElement(`${name}Overlay`);
    }

    trapFocus(container: HTMLElement, e: KeyboardEvent) {
        const focusable = Array.from(container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!container.contains(active)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
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
        // The hero belongs to the start screen chrome, which always appears together with the footer
        if (elementName === 'footer' && className === 'visible') {
            this.elements.hero?.classList.remove('hidden');
        }
    }

    hideElement(elementName, className = 'hidden') {
        const element = this.elements[elementName];
        if (element) {
            element.classList.add(className);
            element.classList.remove('visible');
        }
        if (elementName === 'footer') {
            this.elements.hero?.classList.add('hidden');
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
            // Keyboard scrolling and button activation must keep working inside the open overlay
            if (e.target instanceof Element && e.target.closest('.portfolio-content')) return;
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
        
        if (scrollProgress <= 0.5) {
            // Restore scroll position only if we're not in the MapTiler view
            // If stored scroll position is undefined, use current position
            const targetScroll = this.scrollPosition !== undefined ? this.scrollPosition : currentScroll;
            window.scrollTo(0, targetScroll);
        }
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
        const duration = prefersReducedMotion() ? 0 : 12000;
        const startTime = Date.now();
        const startScroll = window.pageYOffset;
         const progressFill = document.querySelector('.progress-fill') as HTMLDivElement;
        
        const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = duration ? Math.min(elapsed / duration, 1) : 1;
            
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
        
        const progressFill = document.querySelector('.progress-fill') as HTMLDivElement;
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
        const previousOverlay = this.getActiveOverlayElement();

        // Hide currently active overlay if any
        if (this.state.activeOverlay === 'portfolio') {
            this.hideElement('portfolioOverlay');
            this.setState('portfolioManuallyDismissed', true);
        } else if (this.state.activeOverlay === 'showcase') {
            this.hideElement('showcaseOverlay');
        }
        previousOverlay?.setAttribute('aria-hidden', 'true');

        if (!previousOverlay && overlayName !== 'none') {
            this.focusBeforeOverlay = document.activeElement as HTMLElement | null;
        }

        this.lastOverlayToggleTime = Date.now();
        this.setState('activeOverlay', overlayName);

        if (overlayName === 'none') {
            this.unlockScroll();

            if (this.focusBeforeOverlay?.isConnected) {
                this.focusBeforeOverlay.focus({ preventScroll: true });
            }
            this.focusBeforeOverlay = null;
            
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

            const overlay = this.getElement(`${overlayName}Overlay`);
            if (overlay) {
                this.showElement(`${overlayName}Overlay`);
                overlay.setAttribute('aria-hidden', 'false');
                const content = overlay.querySelector('.portfolio-content');
                if (content) {
                    content.scrollTop = 0;
                }
                requestAnimationFrame(() => {
                    overlay.querySelector<HTMLElement>('.close-portfolio')?.focus({ preventScroll: true });
                });
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
