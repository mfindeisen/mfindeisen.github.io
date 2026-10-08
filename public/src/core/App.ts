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
import { t } from '../i18n/i18n.js';

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
    lastScrollProgress: number;
    isSceneHidden = false;
    texturesReady!: Promise<void>;
    // Bumped on every journey start and reset, so callbacks of an abandoned journey can tell they are stale
    journeyToken = 0;
    portfolioTimer: ReturnType<typeof setTimeout> | undefined;

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
            if (this.mapManager.isMapInitialized() && this.uiManager.phase === 'globe') {
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
        this.tooltip.show(t('app.webglMissing'), 6000);
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
            this.mapManager.setInteractions(false);

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
        const ui = this.uiManager;
        ui.getElement('scrollIndicator')?.addEventListener('click', () => ui.startAutoScroll());
        ui.getElement('skipButton')?.addEventListener('click', () => ui.setActiveOverlay('portfolio'));
        ui.getElement('skipShowcaseBtn')?.addEventListener('click', () => ui.setActiveOverlay('showcase'));
        ui.getElement('reopenPortfolioBtn')?.addEventListener('click', () => ui.setActiveOverlay('portfolio'));
        ui.getElement('reopenShowcaseBtn')?.addEventListener('click', () => ui.setActiveOverlay('showcase'));
        ui.getElement('backToBeginningBtn')?.addEventListener('click', () => this.backToBeginning());
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
        // A fixed body reports a scroll offset of 0, which says nothing about the real position
        if (this.uiManager.isScrollLocked) return;

        const scrollProgress = this.scrollController.getScrollProgress();
        const scrollingDown = scrollProgress > this.lastScrollProgress;
        this.lastScrollProgress = scrollProgress;

        this.earthScene.updateTransformation(scrollProgress);
        this.updateMapVisibility(scrollProgress, scrollingDown);
        this.uiManager.updateScrollPosition(window.pageYOffset);
    }

    /**
     * Fly from the unwrapped Earth to Erbil and open the map
     */
    async startJourney() {
        const ui = this.uiManager;
        if (ui.phase !== 'globe' || ui.overlay !== 'none') return;
        const token = ++this.journeyToken;

        // Finish the fade instantly and freeze the page, so scrolling up cannot interrupt the flight
        window.scrollTo({ top: this.scrollController.getMaxScroll(), behavior: 'instant' });
        this.lastScrollProgress = 1;
        ui.lockScroll('journey');
        ui.setPhase('flying');
        this.updateMapVisibility(1);

        const mapReady = await this.waitForMap();
        if (token !== this.journeyToken) return;
        if (!mapReady) {
            console.error('MapTiler map not initialized after waiting');
            ui.setPhase('globe');
            ui.unlockScroll('journey');
            return;
        }

        try {
            await this.mapManager.flyTo(ERBIL_CENTER, ERBIL_ZOOM, prefersReducedMotion() ? 0 : 4000);
        } catch (error) {
            console.error('Error during flyTo animation:', error);
        }
        // reset() stops the camera, which also resolves the flight of an abandoned journey
        if (token !== this.journeyToken) return;

        this.mapManager.setInteractions(true);
        this.mapManager.ensureContainerInteractions(ui.getElement('mapContainer'));
        this.placesManager?.addAllMarkers();
        ui.setPhase('map');

        if (!ui.portfolioIntroDone) {
            this.portfolioTimer = setTimeout(() => {
                if (token === this.journeyToken) ui.setActiveOverlay('portfolio');
            }, 2000);
        }
    }

    async waitForMap() {
        for (let attempt = 0; attempt < 50 && !this.mapManager.isMapInitialized(); attempt++) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.mapManager.isMapInitialized();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // The map covers the globe completely, so there is nothing to draw
        if (this.isSceneHidden) return;

        this.earthScene.update();

        // Render
        this.renderer.render(this.earthScene.scene, this.earthScene.camera);
    }

    updateMapVisibility(progress, scrollingDown = true) {
        const mapContainer = this.uiManager.getElement('mapContainer');
        const footer = this.uiManager.getElement('footer');
        if (!mapContainer) return;

        const phase = this.uiManager.phase;
        const activationThreshold = mapHandoffProgress();

        if (progress <= activationThreshold) {
            mapContainer.style.zIndex = '0';
            mapContainer.style.opacity = '0';
            mapContainer.classList.remove('visible');
            this.showBackgroundElements();
            if (footer) footer.style.marginBottom = '';
            return;
        }

        this.mapManager.cancelPrefetch();

        // Once the flight has started the map stays fully visible, wherever the frozen scroll position is
        const followsScroll = phase === 'globe' || phase === 'returning';
        const fadeProgress = followsScroll
            ? Math.min((progress - activationThreshold) / (1 - activationThreshold), 1.0)
            : 1.0;

        mapContainer.style.zIndex = '2';
        mapContainer.style.opacity = fadeProgress.toString();
        mapContainer.classList.add('visible');
        this.hideBackgroundElements(fadeProgress);

        if (fadeProgress >= 0.5 && footer) {
            footer.style.marginBottom = window.innerWidth <= 768 ? '45px' : '25px';
        }

        // Only moving forward starts the journey, never the scroll back up after "Back to Beginning"
        if (phase === 'globe' && scrollingDown && fadeProgress >= 0.5) {
            this.startJourney();
        }
    }

    hideBackgroundElements(fadeProgress) {
        const container = this.uiManager.getElement('container');
        if (container) {
            container.style.opacity = Math.max(0, 1 - fadeProgress * 2).toString();
            container.style.pointerEvents = 'none';
        }
        this.isSceneHidden = fadeProgress >= 0.5;
    }

    showBackgroundElements() {
        const container = this.uiManager.getElement('container');
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
        this.isSceneHidden = false;
    }

    backToBeginning() {
        const ui = this.uiManager;
        if (ui.phase !== 'map') return;

        const token = ++this.journeyToken;
        clearTimeout(this.portfolioTimer);

        // Leaving the map phase first hides all map chrome before anything else changes
        ui.setPhase('returning');
        ui.setActiveOverlay('none');
        ui.portfolioIntroDone = false;

        if (this.placesManager) {
            this.placesManager.removeAllMarkers();
            this.placesManager.resetAllStates();
        }
        this.mapManager.reset();
        const mapContainer = ui.getElement('mapContainer');
        if (mapContainer) mapContainer.style.pointerEvents = '';
        this.earthScene.reset();

        // Unlocking puts the page back at the bottom, from where the Earth wraps up again on the way to the top
        ui.unlockScroll('journey');
        this.lastScrollProgress = 1;
        this.onScroll();

        this.scrollBackToTop(token);
    }

    /**
     * Animated by hand, because browsers silently drop or cut short a native smooth scroll.
     * The return ends at the top, or wherever the visitor takes over by touching or wheeling.
     */
    scrollBackToTop(token: number) {
        const startY = window.pageYOffset;
        const duration = prefersReducedMotion() ? 0 : 1800;
        const startTime = performance.now();
        let frame = 0;

        const finish = () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('touchstart', finish);
            window.removeEventListener('wheel', finish);
            if (token !== this.journeyToken) return;
            this.uiManager.setPhase('globe');
            this.onScroll();
        };

        const step = (now: number) => {
            if (token !== this.journeyToken) return finish();
            const t = duration ? Math.min((now - startTime) / duration, 1) : 1;
            window.scrollTo({ top: startY * (1 - this.uiManager.easeInOutQuart(t)), behavior: 'instant' });
            if (t < 1) frame = requestAnimationFrame(step);
            else finish();
        };

        window.addEventListener('touchstart', finish, { passive: true });
        window.addEventListener('wheel', finish, { passive: true });
        frame = requestAnimationFrame(step);
    }
}
