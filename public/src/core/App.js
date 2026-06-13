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
            this.mapTilerMap = await this.mapManager.init(
                'maptiler-map',
                'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json',
                '8gl234ODD2pw5oJkzeVo'
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
        this.showcaseBtn = this.uiManager.getElement('showcaseBtn');
        this.backToBeginningBtn = backToBeginningBtn;

        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', this.uiManager.startAutoScroll.bind(this.uiManager));
        }

        if (skipButton) {
            skipButton.addEventListener('click', this.skipToPortfolio.bind(this));
        }

        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.addEventListener('click', this.uiManager.showPortfolio.bind(this.uiManager));
        }

        if (backToBeginningBtn) {
            backToBeginningBtn.addEventListener('click', this.backToBeginning.bind(this));
        }

        if (portfolioOverlay) {
            const closeBtn = portfolioOverlay.querySelector('.close-portfolio');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    if (Date.now() - (this.portfolioOpenTime || 0) < 500) return;
                    this.hidePortfolio();
                });
            }

            portfolioOverlay.addEventListener('click', (e) => {
                if (e.target === portfolioOverlay) {
                    if (Date.now() - (this.portfolioOpenTime || 0) < 500) return;
                    this.hidePortfolio();
                }
            });
        }

        const showcaseBtn = this.uiManager.getElement('showcaseBtn');
        const showcaseOverlay = this.uiManager.getElement('showcaseOverlay');

        if (showcaseBtn) {
            showcaseBtn.addEventListener('click', this.showShowcase.bind(this));
        }

        if (showcaseOverlay) {
            const closeBtn = showcaseOverlay.querySelector('.close-portfolio');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    if (Date.now() - (this.showcaseOpenTime || 0) < 500) return;
                    this.hideShowcase();
                });
            }

            showcaseOverlay.addEventListener('click', (e) => {
                if (e.target === showcaseOverlay) {
                    if (Date.now() - (this.showcaseOpenTime || 0) < 500) return;
                    this.hideShowcase();
                }
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

        if (this.uiManager.getState('flyToAnimationCompleted')) {
            console.log('FlyTo animation already completed, skipping');
            return;
        }

        console.log('Starting smooth flyTo animation to Erbil, Iraq');
        // 36.1892566,44.0100967
        const targetLng = 44.0100967;
        const targetLat = 36.1892566;
        const targetZoom = 13;

        try {
            await this.mapManager.flyTo([targetLng, targetLat], targetZoom, 8000);

            this.uiManager.setState('flyToAnimationCompleted', true);
            this.mapManager.setInteractions(true);

            setTimeout(() => {
                if (this.placesManager) {
                    this.mapManager.ensureContainerInteractions(this.uiManager.getElement('googleEarthContainer'));
                    this.placesManager.addAllMarkers();
                    this.placesManager.setPlacesListVisibility(true);
                }
            }, 100);

            this.uiManager.setState('hasCompletedMapJourney', true);

            if (!this.uiManager.getState('portfolioHasBeenShown') && !this.uiManager.getState('portfolioManuallyDismissed')) {
                setTimeout(() => {
                    this.uiManager.showPortfolio();
                    this.uiManager.setState('portfolioHasBeenShown', true);
                }, 2000);
            } else {
                setTimeout(() => {
                    const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
                    if (reopenPortfolioBtn) {
                        reopenPortfolioBtn.classList.add('visible');
                    }
                    const showcaseBtn = this.uiManager.getElement('showcaseBtn');
                    if (showcaseBtn) {
                        showcaseBtn.classList.add('visible');
                    }
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
        // Handle scroll indicator and skip button visibility
        if (!this.uiManager.getState('isAutoScrolling')) {
            if (window.pageYOffset > 50) {
                this.uiManager.hideElement('scrollIndicator');
                this.uiManager.hideElement('skipButton');
            } else if (window.pageYOffset <= 10 && !this.uiManager.getState('hasCompletedMapJourney')) {
                this.uiManager.showElement('scrollIndicator');
                this.uiManager.showElement('skipButton');
                this.uiManager.hideElement('backToBeginningBtn');
            }
        }

        // Show back to beginning button when at the end
        if (progress > 0.95 && this.uiManager.getState('hasCompletedMapJourney') &&
            !this.uiManager.getElement('portfolioOverlay').classList.contains('visible')) {
            this.uiManager.showElement('backToBeginningBtn');
        } else if (progress <= 0.95 && this.uiManager.getState('hasCompletedMapJourney')) {
            this.uiManager.hideElement('backToBeginningBtn');
        }

        // Check beginning state
        this.uiManager.checkBeginningState(progress);
    }

    
    updateGoogleEarthVisibility(progress, scrollingDown = true) {
        const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');

        if (progress > 0.5) {
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

                const animationThreshold = isMobile ? 0.95 : 0.99;
                // Only trigger the final flyTo animation if we are actively scrolling DOWN
                // This prevents re-triggering it during the "Back to beginning" smooth scroll UP
                if (scrollingDown && fadeProgress >= animationThreshold && !this.uiManager.getState('hasZoomedToErbil')) {
                    this.zoomToErbil();
                    this.uiManager.setState('hasZoomedToErbil', true);
                }
            }
        } else {
            googleEarthContainer.style.zIndex = '0';
            googleEarthContainer.style.opacity = 0;
            googleEarthContainer.classList.remove('visible');

            this.showBackgroundElements();
            this.uiManager.getElement('footer').style.marginBottom = '';

            if (this.uiManager.getState('hasZoomedToErbil') && progress < 0.3 && !this.uiManager.getState('portfolioIsVisible')) {
                this.resetMapTileMap();
                this.uiManager.setState('hasCompletedMapJourney', false);
            }

            this.uiManager.setState('hasZoomedToErbil', false);
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

        if (this.uiManager.getState('portfolioHasBeenShown') && this.uiManager.getState('portfolioManuallyDismissed')) {
            this.uiManager.showElement('reopenPortfolioBtn');
            this.uiManager.showElement('showcaseBtn');
        } else {
            this.uiManager.hideElement('reopenPortfolioBtn');
            this.uiManager.hideElement('showcaseBtn');
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
        this.uiManager.setState('hasZoomedToErbil', false);
    }

    
    skipToPortfolio() {
        console.log('Skipping directly to portfolio');

        // Reset the maptile map to its original state since user is skipping the journey
        this.resetMapTileMap();

        // Hide the skip button and scroll indicator
        const skipButton = this.uiManager.getElement('skipButton');
        const scrollIndicator = this.uiManager.getElement('scrollIndicator');
        const showcaseBtn = this.uiManager.getElement('showcaseBtn');
        if (skipButton) {
            skipButton.classList.add('hidden');
        }
        if (scrollIndicator) {
            scrollIndicator.classList.add('hidden');
        }
        if (showcaseBtn) {
            showcaseBtn.classList.add('hidden');
        }

        // Show portfolio overlay immediately
        this.showPortfolio();
        this.uiManager.setState('portfolioHasBeenShown', true);
    }

    
    backToBeginning() {
        console.log('🟢 backToBeginning() called - RESETTING TO COMPLETE BEGINNING');

        // Hide the back to beginning button immediately
        const backToBeginningBtn = this.uiManager.getElement('backToBeginningBtn');
        if (backToBeginningBtn) {
            backToBeginningBtn.classList.add('hidden');
        }

        // Reset the scroll indicator
        const scrollIndicator = this.uiManager.getElement('scrollIndicator');
        if (scrollIndicator) {
            scrollIndicator.classList.remove('animating');
        }

        // Hide places list immediately and clear any open popups/modals
        if (this.placesManager) {
            this.placesManager.setPlacesListVisibility(false);
            this.placesManager.resetAllStates();
        }

        // Reset Earth to complete sphere (0% morphing)
        this.earthScene.reset();
        this.earthScene.updateTransformation(0); // Force update to sphere state

        // Reset the maptile map to original state
        this.resetMapTileMap();

        // Smooth scroll to top
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Reset all journey flags for a fresh start
        this.hasZoomedToErbil = false;
        this.hasCompletedMapJourney = false;
        this.portfolioHasBeenShown = false;
        this.portfolioManuallyDismissed = false;
        this.flyToAnimationCompleted = false;
        this.portfolioIsVisible = false;
        this.isAutoScrolling = false;

        // Also reset UI manager states
        this.uiManager.setState('portfolioHasBeenShown', false);
        this.uiManager.setState('portfolioManuallyDismissed', false);
        this.uiManager.setState('hasCompletedMapJourney', false);
        this.uiManager.setState('hasZoomedToErbil', false);
        this.uiManager.setState('flyToAnimationCompleted', false);
        this.uiManager.setState('isAutoScrolling', false);
        this.uiManager.setState('portfolioIsVisible', false);

        // Hide the showcase button and reopen portfolio button
        const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.classList.remove('visible');
        }
        const showcaseBtn = this.uiManager.getElement('showcaseBtn');
        if (showcaseBtn) {
            showcaseBtn.classList.remove('visible');
        }

        // Show the initial UI elements after a delay
        setTimeout(() => {
            const scrollIndicator = this.uiManager.getElement('scrollIndicator');
            const skipButton = this.uiManager.getElement('skipButton');
            if (scrollIndicator) {
                scrollIndicator.classList.remove('hidden');
            }
            if (skipButton) {
                skipButton.classList.remove('hidden');
            }
        }, 1000); // Give time for scroll animation to complete
    }

    
    showShowcase() {
        console.log('Showing showcase overlay');
        this.showcaseOpenTime = Date.now();
        const showcaseOverlay = this.uiManager.getElement('showcaseOverlay');
        if (showcaseOverlay) {
            showcaseOverlay.classList.add('visible');
        }

        // Hide places list when showcase is shown
        if (this.placesManager) {
            this.placesManager.setPlacesListVisibility(false);
        }

        // Ensure maptile map is hidden when showcase is shown
        const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
        if (googleEarthContainer) {
            googleEarthContainer.style.opacity = '0';
            googleEarthContainer.style.zIndex = '0';
            googleEarthContainer.classList.remove('visible');
        }

        const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.classList.remove('visible');
        }

        // Prevent background scrolling
        this.uiManager.lockScroll();
    }

    
    hideShowcase() {
        console.log('Hiding showcase overlay');
        const showcaseOverlay = this.uiManager.getElement('showcaseOverlay');
        if (showcaseOverlay) {
            showcaseOverlay.classList.remove('visible');
        }

        // Restore background scrolling
        this.uiManager.unlockScroll();

        // Restore maptile map visibility if we're at the right scroll position
        const scrollProgress = this.scrollController.getScrollProgress();
        if (scrollProgress > 0.5) {
            const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
            if (googleEarthContainer) {
                googleEarthContainer.style.opacity = '1';
                googleEarthContainer.style.zIndex = '2';
                googleEarthContainer.classList.add('visible');
            }

            // Show places list when showcase is hidden and map is visible
            if (this.placesManager) {
                this.placesManager.setPlacesListVisibility(true);
            }

            // Restore buttons
            const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
            if (reopenPortfolioBtn) {
                reopenPortfolioBtn.classList.add('visible');
            }
            const showcaseBtn = this.uiManager.getElement('showcaseBtn');
            if (showcaseBtn) {
                showcaseBtn.classList.add('visible');
            }
        }
    }

    
    showPortfolio() {
        console.log('Showing portfolio overlay');
        this.portfolioOpenTime = Date.now();
        const portfolioOverlay = this.uiManager.getElement('portfolioOverlay');
        if (portfolioOverlay) {
            portfolioOverlay.classList.add('visible');
        }
        this.portfolioIsVisible = true; // Set flag to prevent map resets

        // Hide reopen button when portfolio is shown
        const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
        if (reopenPortfolioBtn) {
            reopenPortfolioBtn.classList.remove('visible');
        }

        // Hide back to beginning button when portfolio is shown
        const backToBeginningBtn = this.uiManager.getElement('backToBeginningBtn');
        if (backToBeginningBtn) {
            backToBeginningBtn.classList.add('hidden');
        }

        const showcaseBtn = this.uiManager.getElement('showcaseBtn');
        if (showcaseBtn) {
            showcaseBtn.classList.remove('visible');
        }

        // Hide places list when portfolio is shown
        if (this.placesManager) {
            this.placesManager.setPlacesListVisibility(false);
        }

        // Ensure maptile map is hidden when portfolio is shown
        const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
        if (googleEarthContainer) {
            googleEarthContainer.style.opacity = '0';
            googleEarthContainer.style.zIndex = '0';
            googleEarthContainer.classList.remove('visible');
        }

        // Prevent background scrolling
        this.uiManager.lockScroll();
    }

    
    hidePortfolio() {
        const hasCompleted = this.uiManager.getState('hasCompletedMapJourney');
        const hasBeenShown = this.uiManager.getState('portfolioHasBeenShown');
        const manuallyDismissed = this.uiManager.getState('portfolioManuallyDismissed');

        console.log('🔴 hidePortfolio() called');
        console.log('🔴 Has completed map journey:', hasCompleted);
        console.log('🔴 Has been shown:', hasBeenShown);

        const portfolioOverlay = this.uiManager.getElement('portfolioOverlay');
        if (portfolioOverlay) {
            portfolioOverlay.classList.remove('visible');
        }
        this.portfolioIsVisible = false; // Clear flag to allow map resets again

        // Mark that user manually dismissed the portfolio
        this.portfolioManuallyDismissed = true;
        this.uiManager.setState('portfolioManuallyDismissed', true);

        // Restore background scrolling
        this.uiManager.unlockScroll();

        // Footer remains visible (no need to restore)

        // Restore maptile map visibility if we're at the right scroll position
        const scrollProgress = this.scrollController.getScrollProgress();
        const currentScroll = window.pageYOffset;
        console.log('🔴 hidePortfolio() - scroll progress:', scrollProgress, 'current scroll:', currentScroll);

        if (scrollProgress > 0.5) {
            console.log('🔴 hidePortfolio() - restoring map visibility WITHOUT calling updateGoogleEarthVisibility');
            // Simply restore the map visibility without calling updateGoogleEarthVisibility
            // to avoid resetting the map position
            const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
            if (googleEarthContainer) {
                googleEarthContainer.style.opacity = '1';
                googleEarthContainer.style.zIndex = '2';
                googleEarthContainer.classList.add('visible');
            }

            // Hide background elements to show the map
            this.hideBackgroundElements(1.0);

            // Show places list when portfolio is hidden and map is visible
            if (this.placesManager) {
                this.placesManager.setPlacesListVisibility(true);
            }

            console.log('🔴 hidePortfolio() - map visibility restored, should stay at Erbil coordinates');
        } else {
            console.log('🔴 hidePortfolio() - scroll progress too low, not restoring map');
        }

        // Only show reopen portfolio button if we've completed the map journey AND portfolio was auto-shown AND manually dismissed
        if (hasCompleted && hasBeenShown && manuallyDismissed) {
            setTimeout(() => {
                // Check if maptile map is visible before showing the button
                const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
                const isMapTileVisible = googleEarthContainer &&
                    googleEarthContainer.classList.contains('visible') &&
                    parseFloat(googleEarthContainer.style.opacity) > 0;

                console.log('Portfolio closed - scroll progress:', scrollProgress, 'hasCompleted:', hasCompleted, 'wasAutoShown:', hasBeenShown, 'isMapTileVisible:', isMapTileVisible);

                if (isMapTileVisible) {
                    const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
                    if (reopenPortfolioBtn) {
                        reopenPortfolioBtn.classList.add('visible');
                    }
                    const showcaseBtn = this.uiManager.getElement('showcaseBtn');
                    if (showcaseBtn) {
                        showcaseBtn.classList.add('visible');
                    }
                    console.log('✅ Showing reopen portfolio button - all conditions met');
                } else {
                    console.log('❌ Not showing reopen portfolio button - maptile map not visible');
                }

                // Also show back to beginning button if we're at the end
                if (scrollProgress > 0.95) {
                    const backToBeginningBtn = this.uiManager.getElement('backToBeginningBtn');
                    if (backToBeginningBtn) {
                        console.log('Showing back to beginning button after portfolio close');
                        backToBeginningBtn.classList.remove('hidden'); // Show by removing hidden class
                        console.log('Button classes after show:', backToBeginningBtn.className);
                    }
                }
            }, 300); // Small delay for smooth transition
        } else {
            // If we haven't completed the map journey and we're at the top, show the initial buttons
            if (window.pageYOffset <= 10) {
                setTimeout(() => {
                    const scrollIndicator = this.uiManager.getElement('scrollIndicator');
                    const skipButton = this.uiManager.getElement('skipButton');
                    const showcaseBtn = this.uiManager.getElement('showcaseBtn');
                    if (scrollIndicator) {
                        scrollIndicator.classList.remove('hidden');
                    }
                    if (skipButton) {
                        skipButton.classList.remove('hidden');
                    }
                    if (showcaseBtn) {
                        showcaseBtn.classList.remove('hidden');
                        showcaseBtn.classList.remove('visible');
                    }
                }, 300); // Small delay for smooth transition
            }
        }

        console.log('Portfolio hidden, flags - flyToCompleted:', this.flyToAnimationCompleted, 'hasZoomed:', this.hasZoomedToErbil);
    }
}

