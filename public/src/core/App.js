import * as THREE from 'three';
import { EarthScene } from '../earth/EarthScene.js';
import { PlacesManager } from '../PlacesManager.js';
import { ScrollController } from '../ScrollController.js';
import { UIManager } from '../ui/UIManager.js';
import { Modal } from '../ui/Modal.js';
import { Tooltip } from '../ui/Tooltip.js';
import { EffectsManager } from '../effects/EffectsManager.js';
import { AnimationController } from '../effects/AnimationController.js';
import { MapManager } from '../map/MapManager.js';
import { AlignmentTool } from '../map/AlignmentTool.js';
import { MathUtils } from '../utils/MathUtils.js';
import { MobileTouchHandler } from '../ui/MobileTouchHandler.js';

import { EasterEggManager } from '../effects/EasterEggManager.js';

export class App {
    constructor() {
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
        Tooltip.init();

        // Initialize modal system
        this.modal = new Modal();

        // Initialize effects manager
        this.effectsManager = new EffectsManager();

        // Initialize animation controller
        this.animationController = new AnimationController(THREE);

        // Initialize scroll controller
        this.scrollController = new ScrollController();

        // Initialize map manager
        this.mapManager = new MapManager();

        // Initialize Three.js renderer
        this.initRenderer();

        // Initialize Earth scene
        this.earthScene = new EarthScene(THREE);

        // Initialize MapTiler
        await this.initMapTiler();

        // Setup event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();

        console.log('App initialized successfully');
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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const container = this.uiManager.getElement('container');
        container.appendChild(this.renderer.domElement);
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

            // Initialize alignment tool
            this.alignmentTool = new AlignmentTool(this.mapManager);
            this.alignmentTool.create();

            // Initialize places manager
            this.placesManager = new PlacesManager(this.mapTilerMap);

            // Set places manager reference in UI manager
            this.uiManager.setPlacesManager(this.placesManager);

            console.log('MapTiler initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MapTiler:', error);
        }
    }

    // Calculate the center point of the 3D Earth model for perfect alignment

    // Method to update center calculation with custom coordinates

    // Method to get the current center (custom or calculated)

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Scroll events
        window.addEventListener('scroll', this.onScroll.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // UI events
        this.setupUIEvents();

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
        const portfolioOverlay = this.uiManager.getElement('portfolioOverlay');

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
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        document.body.appendChild(tooltip);

        setTimeout(() => tooltip.remove(), duration);
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
        this.uiManager.getElement('scrollProgress').textContent = `Progress: ${Math.round(scrollProgress * 100)}%`;

        // Determine scroll direction
        const scrollingDown = scrollProgress > (this.lastScrollProgress || 0);
        this.lastScrollProgress = scrollProgress;

        // Update earth transformation
        this.earthScene.updateTransformation(scrollProgress);

        // Control Google Earth fade-in
        this.updateGoogleEarthVisibility(scrollProgress, scrollingDown);

        // Update UI based on scroll progress
        this.updateUIOnScroll(scrollProgress);
    }

    /**
     * Handle wheel event
     */
    onWheel(e) {
        this.animationController.handleScroll(e, this.earthScene, this.uiManager);
    }

    /**
     * Update UI based on scroll progress
     */

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

        // 36.1892566,44.0100967
        const targetLng = 44.0100967;
        const targetLat = 36.1892566;
        const targetZoom = 13;

        try {
            // Lock scrolling immediately so the user is physically prevented from
            // scrolling up during the flight animation and ruining the map experience
            this.uiManager.lockScroll();

            this.uiManager.setState('journeyState', 'flying');

            // Reduced duration from 8000ms to 4000ms for a much faster direct flight
            await this.mapManager.flyTo([targetLng, targetLat], targetZoom, 4000);

            this.uiManager.setState('journeyState', 'arrived');
            this.mapManager.setInteractions(true);

            setTimeout(() => {
                if (this.placesManager) {
                    this.mapManager.ensureContainerInteractions(this.uiManager.getElement('googleEarthContainer'));
                    this.placesManager.addAllMarkers();
                    this.placesManager.setPlacesListVisibility(true);
                }
            }, 100);

            if (!this.uiManager.getState('portfolioHasBeenShown') && !this.uiManager.getState('portfolioManuallyDismissed')) {
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

    enableMapInteractions(enable) {
        this.mapManager.setInteractions(enable);
    }

    ensureMapContainerInteractions() {
        this.mapManager.ensureContainerInteractions(this.uiManager.getElement('googleEarthContainer'));
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update earth scene
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
            this.uiManager.getState('activeOverlay') === 'none') {
            this.uiManager.showElement('backToBeginningBtn');
        } else if (progress <= 0.95 && this.uiManager.getState('journeyState') === 'arrived') {
            this.uiManager.hideElement('backToBeginningBtn');
        }

        // Check beginning state
        this.uiManager.checkBeginningState(progress);
    }


    updateGoogleEarthVisibility(progress, scrollingDown = true) {
        const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');

        if (progress > 0.5) {
            console.log("Progress is greater than 0.5");
            // Force hide scroll indicator and skip button on the map view
            this.uiManager.hideElement('scrollIndicator');
            this.uiManager.hideElement('skipButton');

            googleEarthContainer.style.zIndex = '0';
            googleEarthContainer.style.opacity = 0;

            const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
            const activationThreshold = isMobile ? 0.90 : 0.968;
            const fadeRange = isMobile ? 0.10 : 0.032;

            if (progress > activationThreshold) {
                const fadeProgress = Math.min((progress - activationThreshold) / fadeRange, 1.0);

                googleEarthContainer.style.zIndex = '2';
                googleEarthContainer.style.opacity = fadeProgress;
                googleEarthContainer.classList.add('visible');

                this.hideBackgroundElements(fadeProgress);

                if (fadeProgress >= 0.5) {
                    this.uiManager.getElement('footer').style.marginBottom = window.innerWidth <= 768 ? '45px' : '25px';
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

                const animationThreshold = isMobile ? 0.95 : 0.99;
                // Only trigger the final flyTo animation if we are actively scrolling DOWN
                // This prevents re-triggering it during the "Back to beginning" smooth scroll UP
                if (scrollingDown && fadeProgress >= animationThreshold && this.uiManager.getState('journeyState') === 'idle') {
                    this.zoomToErbil();
                }
            }
        } else {
            googleEarthContainer.style.zIndex = '0';
            googleEarthContainer.style.opacity = 0;
            googleEarthContainer.classList.remove('visible');

            this.showBackgroundElements();
            this.uiManager.getElement('footer').style.marginBottom = '';

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
            container.style.opacity = Math.max(0, 1 - fadeProgress * 2);
            container.style.pointerEvents = 'none';
        }

        this.uiManager.hideElement('scrollIndicator');
        this.uiManager.hideElement('skipButton');
        this.uiManager.hideElement('footer');

        // Do not show any top-level overlay buttons during the unwrap animation
        if (this.uiManager.getState('journeyState') !== 'arrived') {
            this.uiManager.hideElement('reopenPortfolioBtn');
            this.uiManager.hideElement('reopenShowcaseBtn');
        }

        this.uiManager.showElement('backToBeginningBtn');

        const infoPanel = document.querySelector('.info');
        if (infoPanel) {
            infoPanel.style.opacity = Math.max(0, 1 - fadeProgress * 2);
        }
    }


    showBackgroundElements() {
        const container = this.uiManager.getElement('container');
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }

        const infoPanel = document.querySelector('.info');
        if (infoPanel) {
            infoPanel.style.opacity = '1';
        }
    }





    resetMapTileMap() {
        console.log('🟡 resetMapTileMap() called - THIS SHOULD NOT HAPPEN WHEN PORTFOLIO IS CLOSED');
        console.trace('🟡 resetMapTileMap() call stack:');

        this.mapManager.reset();
        this.uiManager.setState('journeyState', 'idle');
    }


    skipToOverlay(overlayName) {
        console.log(`Skipping directly to ${overlayName}`);

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
        console.log('🟢 backToBeginning() called - RESETTING TO COMPLETE BEGINNING');

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
                const footer = this.uiManager.getElement('footer');

                if (scrollIndicator) scrollIndicator.classList.remove('hidden');
                if (skipButton) skipButton.classList.remove('hidden');
                if (skipShowcaseBtn) skipShowcaseBtn.classList.remove('hidden');
                if (footer) footer.classList.remove('hidden');
            }
        }, 1000); // Give time for scroll animation to complete
    }
}
