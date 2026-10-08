import * as THREE from 'three';
import { EarthScene } from '../earth/EarthScene.js';
import { PlacesManager } from '../PlacesManager.js';
import { ScrollController } from '../ScrollController.js';
import { UIManager } from '../ui/UIManager.js';
import { Tooltip } from '../ui/Tooltip.js';
import { MapManager, mapHandoffProgress } from '../map/MapManager.js';
import { MobileTouchHandler } from '../ui/MobileTouchHandler.js';
import { prefersReducedMotion } from '../utils/motion.js';

import { EasterEggManager } from '../effects/EasterEggManager.js';

// 36.1892566,44.0100967
const ERBIL_CENTER: [number, number] = [44.0100967, 36.1892566];
const ERBIL_ZOOM = 13;

export class App {
    uiManager!: UIManager;
    tooltip!: Tooltip;
    scrollController!: ScrollController;
    mapManager!: MapManager;
    earthScene!: EarthScene;
    renderer!: THREE.WebGLRenderer;
    mapTilerMap: any;
    placesManager?: PlacesManager;
    mobileTouchHandler!: MobileTouchHandler;
    easterEggManager!: EasterEggManager;
    scrollIndicator: any;
    skipButton: any;
    skipShowcaseBtn: any;
    backToBeginningBtn: any;
    lastScrollProgress: number;
    isSceneHidden = false;
    texturesReady!: Promise<void>;

    constructor() {
        this.lastScrollProgress = 0;
        this.resetScrollPosition();
        this.init();
    }

    resetScrollPosition() {
        // Prevent browser from restoring scroll position
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Reset scroll to top immediately
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Also reset after a short delay to override browser restoration
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 100);
    }

    async init() {
        // Initialize UI manager
        this.uiManager = new UIManager();

        // Initialize tooltip system
        this.tooltip = new Tooltip();

        // Initialize scroll controller
        this.scrollController = new ScrollController();

        // Initialize map manager
        this.mapManager = new MapManager();

        try {
            this.initRenderer();
        } catch (error) {
            console.error('WebGL is not available:', error);
            this.initWithoutWebGL();
            return;
        }

        this.setupLoader();

        // Initialize Earth scene
        this.earthScene = new EarthScene(THREE);

        // Start rendering the globe right away instead of waiting for the map style to load
        this.animate();

        // Buttons must work before the map has finished loading
        this.setupUIEvents();

        // Initialize MapTiler
        await this.initMapTiler();

        // Setup event listeners
        this.setupEventListeners();

        // Load the Erbil tiles in the background so the flight does not land on an empty map.
        // Waiting for the first scroll spares the MapTiler quota for visitors who never start the journey,
        // and waiting for the globe textures keeps both from competing for bandwidth.
        Promise.all([this.texturesReady, this.firstScroll()]).then(() => {
            if (this.mapManager.isMapInitialized() && this.uiManager.getState('journeyState') === 'idle') {
                this.mapManager.prefetchArea(ERBIL_CENTER, [6, 8, 10, 12, ERBIL_ZOOM]);
            }
        });
    }

    firstScroll() {
        return new Promise<void>(resolve => {
            const onScroll = () => {
                if (window.scrollY <= 0) return;
                window.removeEventListener('scroll', onScroll);
                resolve();
            };
            window.addEventListener('scroll', onScroll, { passive: true });
        });
    }

    /**
     * Initialize Three.js renderer
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setClearColor(0x000000);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        const container = this.uiManager.getElement('container');
        if (!container) throw new Error('#canvas-container is missing');
        container.appendChild(this.renderer.domElement);
    }

    /**
     * Without WebGL there is no globe or map, so the overlays become the whole site
     */
    initWithoutWebGL() {
        document.body.classList.add('no-webgl');
        document.getElementById('loader')?.remove();

        this.uiManager.getElement('skipButton')?.addEventListener('click', () => this.uiManager.setActiveOverlay('portfolio'));
        this.uiManager.getElement('skipShowcaseBtn')?.addEventListener('click', () => this.uiManager.setActiveOverlay('showcase'));

        this.uiManager.setActiveOverlay('portfolio');
        this.tooltip.show('The interactive 3D Earth needs WebGL, which is not available in this browser.', 6000);
    }

    /**
     * Show load progress of the Earth textures and fade the loader out once they are ready
     */
    setupLoader() {
        const loader = document.getElementById('loader');
        const progressLabel = document.getElementById('loader-progress');

        let resolveTexturesReady!: () => void;
        this.texturesReady = new Promise(resolve => { resolveTexturesReady = resolve; });

        if (!loader) {
            resolveTexturesReady();
            return;
        }

        const hide = () => {
            resolveTexturesReady();
            if (loader.classList.contains('done')) return;
            loader.classList.add('done');
            setTimeout(() => loader.remove(), 800);
        };

        const manager = THREE.DefaultLoadingManager;
        manager.onProgress = (_url, loaded, total) => {
            if (progressLabel) progressLabel.textContent = `${Math.round((loaded / total) * 100)}%`;
        };
        manager.onLoad = hide;
        manager.onError = hide;

        // Never keep visitors waiting on a stalled texture request
        setTimeout(hide, 15000);
    }

    /**
     * Initialize MapTiler
     */
    async initMapTiler() {
        try {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const localApiKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_MAPTILER_LOCAL_API_KEY : null;
            const apiKey = (isLocalhost && localApiKey) ? localApiKey : '8gl234ODD2pw5oJkzeVo';

            this.mapTilerMap = await this.mapManager.init(
                'maptiler-map',
                'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json',
                apiKey
            );

            // Start with interactions disabled
            this.enableMapInteractions(false);

            // Initialize places manager
            this.placesManager = new PlacesManager(this.mapTilerMap);

            // Set places manager reference in UI manager
            this.uiManager.setPlacesManager(this.placesManager);

        } catch (error) {
            console.error('Failed to initialize MapTiler:', error);
        }
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Scroll events
        window.addEventListener('scroll', this.onScroll.bind(this));

        // Mobile touch handling
        this.mobileTouchHandler = new MobileTouchHandler(this);
        this.mobileTouchHandler.setup();

        // Easter egg controls
        this.easterEggManager = new EasterEggManager(this);
        this.easterEggManager.setup();
    }

    /**
     * Setup UI event listeners
     */
    setupUIEvents() {
        const scrollIndicator = this.uiManager.getElement('scrollIndicator');
        const skipButton = this.uiManager.getElement('skipButton');
        const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
        const backToBeginningBtn = this.uiManager.getElement('backToBeginningBtn');

        // Store element references as class properties
        this.scrollIndicator = scrollIndicator;
        this.skipButton = skipButton;
        this.skipShowcaseBtn = this.uiManager.getElement('skipShowcaseBtn');
        this.backToBeginningBtn = backToBeginningBtn;

        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', this.uiManager.startAutoScroll.bind(this.uiManager));
        }

        if (skipButton) {
            skipButton.addEventListener('click', () => this.skipToOverlay('portfolio'));
        }

        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.addEventListener('click', () => {
                this.uiManager.setActiveOverlay('portfolio');
            });
        }

        if (backToBeginningBtn) {
            backToBeginningBtn.addEventListener('click', this.backToBeginning.bind(this));
        }

        // Overlay close events are now handled centrally by UIManager.setupOverlayListeners

        const skipShowcaseBtn = this.uiManager.getElement('skipShowcaseBtn');
        if (skipShowcaseBtn) {
            skipShowcaseBtn.addEventListener('click', () => {
                this.skipToOverlay('showcase');
            });
        }

        const reopenShowcaseBtn = this.uiManager.getElement('reopenShowcaseBtn');
        if (reopenShowcaseBtn) {
            reopenShowcaseBtn.addEventListener('click', () => {
                this.uiManager.setActiveOverlay('showcase');
            });
        }
    }

    showTooltip(message, duration = 2000) {
        this.tooltip.show(message, duration);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.earthScene.camera.aspect = width / height;
        this.earthScene.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    onScroll() {
        // Prevent fake scroll events caused by CSS position: fixed from ruining the state
        if (this.uiManager && this.uiManager.getState('isScrollLocked')) {
            return;
        }

        const scrollProgress = this.scrollController.getScrollProgress();

        // Determine scroll direction
        const scrollingDown = scrollProgress > (this.lastScrollProgress || 0);
        this.lastScrollProgress = scrollProgress;

        // Update earth transformation
        this.earthScene.updateTransformation(scrollProgress);

        // Fade the map in over the globe
        this.updateMapVisibility(scrollProgress, scrollingDown);

        // Update UI based on scroll progress
        this.updateUIOnScroll(scrollProgress);
    }

    async zoomToErbil() {
        // Wait for map to be initialized
        let attempts = 0;
        while (!this.mapManager.isMapInitialized() && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!this.mapManager.isMapInitialized()) {
            console.error('MapTiler map not initialized after waiting');
            return;
        }

        if (this.uiManager.getState('journeyState') === 'arrived') {
            console.log('FlyTo animation already completed, skipping');
            return;
        }

        console.log('Starting smooth flyTo animation to Erbil, Iraq');

        // Force hide all scroll-related UI during the flight animation
        this.uiManager.hideElement('scrollIndicator');
        this.uiManager.hideElement('skipButton');
        this.uiManager.hideElement('skipShowcaseBtn');
        this.uiManager.hideElement('footer');

        try {
            // Lock scrolling immediately so the user is physically prevented from
            // scrolling up during the flight animation and ruining the map experience
            window.scrollTo(0, this.scrollController.getMaxScroll());
            this.uiManager.lockScroll();

            this.uiManager.setState('journeyState', 'flying');
            this.updateMapVisibility(1);

            await this.mapManager.flyTo(ERBIL_CENTER, ERBIL_ZOOM, prefersReducedMotion() ? 0 : 4000);

            this.uiManager.setState('journeyState', 'arrived');
            this.mapManager.setInteractions(true);

            const willAutoOpenPortfolio = !this.isPortfolioIntroDone();

            setTimeout(() => {
                if (this.placesManager) {
                    this.mapManager.ensureContainerInteractions(this.uiManager.getElement('mapContainer'));
                    this.placesManager.addAllMarkers();
                    this.placesManager.setPlacesListVisibility(true);
                }
                if (!willAutoOpenPortfolio && this.uiManager.getState('activeOverlay') === 'none') {
                    this.uiManager.showElement('backToBeginningBtn');
                }
            }, 100);

            if (willAutoOpenPortfolio) {
                setTimeout(() => {
                    this.uiManager.setActiveOverlay('portfolio');
                    this.uiManager.setState('portfolioHasBeenShown', true);
                }, 2000);
            } else {
                setTimeout(() => {
                    this.uiManager.showElement('reopenPortfolioBtn');
                    this.uiManager.showElement('reopenShowcaseBtn');
                }, 500);
            }
        } catch (error) {
            console.error('Error during flyTo animation:', error);
        }
    }

    isPortfolioIntroDone() {
        return this.uiManager.getState('portfolioHasBeenShown') || this.uiManager.getState('portfolioManuallyDismissed');
    }

    enableMapInteractions(enable) {
        this.mapManager.setInteractions(enable);
    }

    ensureMapContainerInteractions() {
        this.mapManager.ensureContainerInteractions(this.uiManager.getElement('mapContainer'));
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // The map covers the globe completely, so there is nothing to draw
        if (this.isSceneHidden) return;

        this.earthScene.update();

        // Render
        this.renderer.render(this.earthScene.scene, this.earthScene.camera);
    }

    updateUIOnScroll(progress) {
        const journeyState = this.uiManager.getState('journeyState');

        // Never show UI elements while flying or after arrived
        if (journeyState === 'flying' || journeyState === 'arrived') {
            this.uiManager.hideElement('scrollIndicator');
            this.uiManager.hideElement('skipButton');
            this.uiManager.hideElement('skipShowcaseBtn');
            this.uiManager.hideElement('footer');
        } else {
            if (window.pageYOffset > 50) {
                this.uiManager.hideElement('scrollIndicator');
                this.uiManager.hideElement('skipButton');
                this.uiManager.hideElement('skipShowcaseBtn');
                this.uiManager.hideElement('footer');
            } else if (window.pageYOffset <= 10) {
                // Only show them if we are not currently auto-scrolling (e.g. smooth scrolling to top)
                if (!this.uiManager.getState('isAutoScrolling')) {
                    this.uiManager.showElement('scrollIndicator');
                    this.uiManager.showElement('skipButton');
                    this.uiManager.showElement('skipShowcaseBtn');
                    this.uiManager.showElement('footer');
                    this.uiManager.hideElement('backToBeginningBtn');
                }
            }
        }

        // Show back to beginning button when at the end
        if (progress > 0.95 && this.uiManager.getState('journeyState') === 'arrived' &&
            this.uiManager.getState('activeOverlay') === 'none' &&
            this.isPortfolioIntroDone() &&
            (this.placesManager?.markers.size ?? 0) > 0) {
            this.uiManager.showElement('backToBeginningBtn');
        } else if (progress <= 0.95 && this.uiManager.getState('journeyState') === 'arrived') {
            this.uiManager.hideElement('backToBeginningBtn');
        }

        // Check beginning state
        this.uiManager.checkBeginningState(progress);
    }


    updateMapVisibility(progress, scrollingDown = true) {
        const mapContainer = this.uiManager.getElement('mapContainer');
        const footer = this.uiManager.getElement('footer');
        if (!mapContainer) return;

        if (progress > 0.5) {
            // Force hide scroll indicator and skip button on the map view
            this.uiManager.hideElement('scrollIndicator');
            this.uiManager.hideElement('skipButton');

            mapContainer.style.zIndex = '0';
            mapContainer.style.opacity = '0';

            const activationThreshold = mapHandoffProgress();
            const fadeRange = 1 - activationThreshold;

            if (progress > activationThreshold) {
                this.mapManager.cancelPrefetch();

                // Once the flight has started the scroll position can be frozen mid-fade by the scroll lock
                const fadeProgress = this.uiManager.getState('journeyState') === 'idle'
                    ? Math.min((progress - activationThreshold) / fadeRange, 1.0)
                    : 1.0;

                mapContainer.style.zIndex = '2';
                mapContainer.style.opacity = fadeProgress.toString();
                mapContainer.classList.add('visible');

                this.hideBackgroundElements(fadeProgress);

                if (fadeProgress >= 0.5 && footer) {
                    footer.style.marginBottom = window.innerWidth <= 768 ? '45px' : '25px';
                }

                // Map UI visibility check - ensure places list and buttons are shown if we arrived
                if (this.uiManager.getState('journeyState') === 'arrived' && this.uiManager.getState('activeOverlay') === 'none') {
                    if (this.placesManager) {
                        this.placesManager.setPlacesListVisibility(true);
                    }
                    if (this.uiManager.getState('portfolioHasBeenShown') && this.uiManager.getState('portfolioManuallyDismissed')) {
                        this.uiManager.showElement('reopenPortfolioBtn');
                        this.uiManager.showElement('reopenShowcaseBtn');
                    }
                }

                // Only trigger the final flyTo animation if we are actively scrolling DOWN
                // This prevents re-triggering it during the "Back to beginning" smooth scroll UP
                if (scrollingDown && fadeProgress >= 0.5 && this.uiManager.getState('journeyState') === 'idle') {
                    this.zoomToErbil();
                }
            }
        } else {
            mapContainer.style.zIndex = '0';
            mapContainer.style.opacity = '0';
            mapContainer.classList.remove('visible');

            this.showBackgroundElements();
            if (footer) footer.style.marginBottom = '';

            // Force hide all map-specific UI when map is not visible
            this.uiManager.hideElement('reopenPortfolioBtn');
            this.uiManager.hideElement('reopenShowcaseBtn');
            if (this.placesManager) {
                this.placesManager.setPlacesListVisibility(false);
            }

            if (this.uiManager.getState('journeyState') !== 'idle' && progress < 0.3 && this.uiManager.getState('activeOverlay') === 'none') {
                this.resetMapTileMap();
                if (this.placesManager) {
                    this.placesManager.removeAllMarkers();
                    this.placesManager.resetAllStates();
                }
                this.uiManager.setState('journeyState', 'idle');
            }
        }
    }


    hideBackgroundElements(fadeProgress) {
        const container = this.uiManager.getElement('container');
        if (container) {
            container.style.opacity = Math.max(0, 1 - fadeProgress * 2).toString();
            container.style.pointerEvents = 'none';
        }
        this.isSceneHidden = fadeProgress >= 0.5;

        this.uiManager.hideElement('scrollIndicator');
        this.uiManager.hideElement('skipButton');
        this.uiManager.hideElement('footer');

        // Do not show any top-level overlay buttons during the unwrap animation
        if (this.uiManager.getState('journeyState') !== 'arrived') {
            this.uiManager.hideElement('reopenPortfolioBtn');
            this.uiManager.hideElement('reopenShowcaseBtn');
        }
    }


    showBackgroundElements() {
        const container = this.uiManager.getElement('container');
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
        this.isSceneHidden = false;
    }





    resetMapTileMap() {
        this.mapManager.reset();
        this.uiManager.setState('journeyState', 'idle');
    }


    skipToOverlay(overlayName) {
        // Reset the maptile map to its original state since user is skipping the journey
        this.resetMapTileMap();

        // Hide the skip button, showcase button, scroll indicator, and footer natively via UIManager
        this.uiManager.hideElement('skipButton');
        this.uiManager.hideElement('scrollIndicator');
        this.uiManager.hideElement('skipShowcaseBtn');
        this.uiManager.hideElement('footer');

        // Special state tracking for portfolio
        if (overlayName === 'portfolio') {
            this.uiManager.setState('portfolioHasBeenShown', true);
        }

        // Show requested overlay immediately
        this.uiManager.setActiveOverlay(overlayName);
    }


    backToBeginning() {
        // Hide the back to beginning button immediately
        const backToBeginningBtn = this.uiManager.getElement('backToBeginningBtn');
        if (backToBeginningBtn) {
            backToBeginningBtn.classList.add('hidden');
        }

        // Hide any open overlays
        this.uiManager.setActiveOverlay('none');

        // Reset the scroll indicator
        const scrollIndicator = this.uiManager.getElement('scrollIndicator');
        if (scrollIndicator) {
            scrollIndicator.classList.remove('animating');
        }

        // Hide places list immediately, remove all markers, and clear any open popups/modals
        if (this.placesManager) {
            this.placesManager.setPlacesListVisibility(false);
            this.placesManager.removeAllMarkers();
            this.placesManager.resetAllStates();
        }

        // Reset Earth to complete sphere (0% morphing)
        this.earthScene.reset();
        this.earthScene.updateTransformation(0); // Force update to sphere state

        // Reset the maptile map to original state
        this.resetMapTileMap();

        // Unlock the scroll so the user can smoothly slide back to the top
        this.uiManager.unlockScroll();

        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Reset all journey flags for a fresh start
        this.uiManager.setState('journeyState', 'idle');
        this.uiManager.setState('portfolioHasBeenShown', false);
        this.uiManager.setState('portfolioManuallyDismissed', false);
        this.uiManager.setState('activeOverlay', 'none');

        // Protect the scroll up with isAutoScrolling
        this.uiManager.setState('isAutoScrolling', true);

        let scrollTimeout;
        const finishAutoScroll = () => {
            this.uiManager.setState('isAutoScrolling', false);
            window.removeEventListener('scroll', checkScrollComplete);
            clearTimeout(scrollTimeout);
        };

        const checkScrollComplete = () => {
            if (window.pageYOffset <= 5) {
                finishAutoScroll();
            }
        };

        window.addEventListener('scroll', checkScrollComplete);
        scrollTimeout = setTimeout(finishAutoScroll, 2000); // Fallback

        // Hide the showcase button and reopen portfolio button
        const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.classList.remove('visible');
        }
        const skipShowcaseBtn = this.uiManager.getElement('skipShowcaseBtn');
        if (skipShowcaseBtn) {
            skipShowcaseBtn.classList.remove('visible');
        }

        const reopenShowcaseBtn = this.uiManager.getElement('reopenShowcaseBtn');
        if (reopenShowcaseBtn) {
            reopenShowcaseBtn.classList.remove('visible');
        }

        // Show the initial UI elements after a delay ONLY IF we are still at the top and not locked
        setTimeout(() => {
            if (window.pageYOffset <= 50 && !this.uiManager.getState('isScrollLocked')) {
                const scrollIndicator = this.uiManager.getElement('scrollIndicator');
                const skipButton = this.uiManager.getElement('skipButton');
                const skipShowcaseBtn = this.uiManager.getElement('skipShowcaseBtn');

                if (scrollIndicator) scrollIndicator.classList.remove('hidden');
                if (skipButton) skipButton.classList.remove('hidden');
                if (skipShowcaseBtn) skipShowcaseBtn.classList.remove('hidden');
                this.uiManager.showElement('footer');
            }
        }, 1000); // Give time for scroll animation to complete
    }
}
