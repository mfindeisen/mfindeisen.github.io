import { prefersReducedMotion } from '../utils/motion.js';

/**
 * globe:     start screen and the scroll-driven unwrap, nothing has been flown yet
 * flying:    camera flight to Erbil, the page is locked
 * map:       arrived on the map, the page stays locked until "Back to Beginning"
 * returning: smooth scroll back to the top after "Back to Beginning"
 */
export type Phase = 'globe' | 'flying' | 'map' | 'returning';
export type OverlayName = 'none' | 'portfolio' | 'showcase';
export type ScrollLockReason = 'journey' | 'overlay';

/**
 * UIManager - Owns the UI state and derives the visibility of all chrome from it in syncUI()
 */
export class UIManager {
    elements: { [key: string]: HTMLElement | null };
    phase: Phase = 'globe';
    overlay: OverlayName = 'none';
    portfolioIntroDone = false;
    atTop = true;
    isAutoScrolling = false;
    lastOverlayToggleTime: number;
    autoScrollAnimation: number | null;
    scrollLocks = new Set<ScrollLockReason>();
    scrollPosition: number;
    preventScrollKeys: ((e: KeyboardEvent) => void) | null;
    placesManager: any;
    focusBeforeOverlay: HTMLElement | null = null;

    constructor(placesManager: any = null) {
        this.elements = {
            container: document.getElementById('canvas-container'),
            mapContainer: document.getElementById('map-container'),
            scrollIndicator: document.getElementById('scroll-indicator'),
            portfolioOverlay: document.getElementById('portfolio-overlay'),
            skipButton: document.getElementById('skip-button'),
            skipShowcaseBtn: document.getElementById('skip-showcase-btn'),
            reopenPortfolioBtn: document.getElementById('reopen-portfolio-btn'),
            reopenShowcaseBtn: document.getElementById('reopen-showcase-btn'),
            showcaseOverlay: document.getElementById('showcase-overlay'),
            backToBeginningBtn: document.getElementById('back-to-beginning-btn'),
            footer: document.getElementById('footer'),
            hero: document.getElementById('hero')
        };

        this.lastOverlayToggleTime = 0;
        this.setupOverlayListeners();
        this.setupOverlayToc(this.getElement('showcaseOverlay'));
        this.setupOverlayToc(this.getElement('portfolioOverlay'));

        this.autoScrollAnimation = null;
        this.scrollPosition = 0;
        this.preventScrollKeys = null;
        this.placesManager = placesManager;
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
        return this.overlay === 'none' ? null : this.getElement(`${this.overlay}Overlay`);
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

    setPhase(phase: Phase) {
        if (this.phase === phase) return;
        this.phase = phase;
        if (phase !== 'globe') this.stopAutoScroll();
        this.syncUI();
    }

    /**
     * Called for every scroll position change while the page is not locked
     */
    updateScrollPosition(scrollY: number) {
        // Hysteresis keeps the start chrome from flickering around the threshold
        if (scrollY <= 10) this.atTop = true;
        else if (scrollY > 50) this.atTop = false;
        this.syncUI();
    }

    /**
     * Single source of truth for the visibility of all buttons, the start chrome and the places list
     */
    syncUI() {
        const noOverlay = this.overlay === 'none';
        const onGlobe = this.phase === 'globe' && noOverlay;
        const onMap = this.phase === 'map' && noOverlay;
        const startChrome = onGlobe && this.atTop && !this.isAutoScrolling;
        const mapChrome = onMap && this.portfolioIntroDone;

        this.setVisible('skipButton', startChrome);
        this.setVisible('skipShowcaseBtn', startChrome);
        this.setVisible('footer', startChrome);
        this.setVisible('scrollIndicator', startChrome || (onGlobe && this.isAutoScrolling));
        this.elements.scrollIndicator?.classList.toggle('animating', onGlobe && this.isAutoScrolling);

        this.setVisible('reopenPortfolioBtn', mapChrome);
        this.setVisible('reopenShowcaseBtn', mapChrome);
        this.setVisible('backToBeginningBtn', mapChrome);

        this.placesManager?.setPlacesListVisibility(onMap);
    }

    setVisible(elementName: string, visible: boolean) {
        if (visible) this.showElement(elementName);
        else this.hideElement(elementName);
    }

    // Set places manager reference
    setPlacesManager(placesManager) {
        this.placesManager = placesManager;
        this.syncUI();
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

    get isScrollLocked() {
        return this.scrollLocks.size > 0;
    }

    /**
     * The page stays locked as long as at least one reason holds the lock
     */
    lockScroll(reason: ScrollLockReason) {
        const wasLocked = this.isScrollLocked;
        this.scrollLocks.add(reason);
        if (wasLocked) return;

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
    }

    /**
     * Releases one lock reason. The page only becomes scrollable again, at the position it was
     * locked at, once no reason is left.
     */
    unlockScroll(reason: ScrollLockReason) {
        if (!this.scrollLocks.delete(reason) || this.isScrollLocked) return;

        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        if (this.preventScrollKeys) {
            document.removeEventListener('keydown', this.preventScrollKeys);
            this.preventScrollKeys = null;
        }

        // While the body is fixed the document has no scroll offset, so it has to be put back
        window.scrollTo({ top: this.scrollPosition, behavior: 'instant' });
    }

    // Auto-scroll functionality
    startAutoScroll() {
        if (this.isAutoScrolling || this.phase !== 'globe' || this.overlay !== 'none') return;

        this.isAutoScrolling = true;
        this.syncUI();

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
                this.stopAutoScroll();
            }
        };
        
        this.autoScrollAnimation = requestAnimationFrame(animateScroll);
    }

    stopAutoScroll() {
        if (this.autoScrollAnimation !== null) {
            cancelAnimationFrame(this.autoScrollAnimation);
            this.autoScrollAnimation = null;
        }
        if (!this.isAutoScrolling) return;

        this.isAutoScrolling = false;
        const progressFill = document.querySelector('.progress-fill') as HTMLDivElement;
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        this.syncUI();
    }

    setActiveOverlay(overlayName: OverlayName) {
        if (overlayName === this.overlay) return;
        // Overlays only open on the start screen or the map, never mid-flight or while returning
        if (overlayName !== 'none' && (this.phase === 'flying' || this.phase === 'returning')) return;

        const previousOverlay = this.getActiveOverlayElement();
        if (previousOverlay) {
            this.hideElement(`${this.overlay}Overlay`);
            previousOverlay.setAttribute('aria-hidden', 'true');
        } else {
            this.focusBeforeOverlay = document.activeElement as HTMLElement | null;
        }

        this.lastOverlayToggleTime = Date.now();
        this.overlay = overlayName;

        if (overlayName === 'none') {
            this.unlockScroll('overlay');

            if (this.focusBeforeOverlay?.isConnected) {
                this.focusBeforeOverlay.focus({ preventScroll: true });
            }
            this.focusBeforeOverlay = null;
        } else {
            this.stopAutoScroll();
            this.lockScroll('overlay');
            if (overlayName === 'portfolio') this.portfolioIntroDone = true;

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

        this.syncUI();
    }

    // Utility functions
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    // Cleanup
    destroy() {
        this.stopAutoScroll();

        if (this.preventScrollKeys) {
            document.removeEventListener('keydown', this.preventScrollKeys);
        }
    }
}
