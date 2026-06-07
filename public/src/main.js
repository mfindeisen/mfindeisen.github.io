import * as THREE from 'three';
import { EarthScene } from './earth/EarthScene.js';
import { PlacesManager } from './PlacesManager.js';
import { ScrollController } from './ScrollController.js';
import { UIManager } from './ui/UIManager.js';
import { Modal } from './ui/Modal.js';
import { Tooltip } from './ui/Tooltip.js';
import { EffectsManager } from './effects/EffectsManager.js';
import { AnimationController } from './effects/AnimationController.js';
import { MapManager } from './map/MapManager.js';
import { AlignmentTool } from './map/AlignmentTool.js';
import { MathUtils } from './utils/MathUtils.js';

class App {
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
            await this.mapManager.init(
                'maptiler-map',
                'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json',
                '8gl234ODD2pw5oJkzeVo'
            );

            // Initialize alignment tool
            this.alignmentTool = new AlignmentTool(this.mapManager);
            this.alignmentTool.create();

            // Initialize places manager
            this.placesManager = new PlacesManager(this.mapManager.getMap());

            console.log('MapTiler initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MapTiler:', error);
        }
    }

    // Calculate the center point of the 3D Earth model for perfect alignment
    calculateEarthCenter() {
        // The 3D Earth model uses equirectangular projection
        // When morphed to flat plane, it covers a specific geographic area

        // Based on the morphing geometry, the plane covers:
        // Width: Math.PI * 5 (approximately 15.71 units)
        // Height: Math.PI * 2.5 (approximately 7.85 units)

        // For equirectangular projection:
        // - Width covers 360° of longitude
        // - Height covers 180° of latitude (from -90° to +90°)

        // The center of the plane corresponds to:
        // Longitude: 0° (Greenwich meridian)
        // Latitude: 0° (Equator)

        // However, we need to account for any offset in the 3D model
        // Let's use the center of the visible Earth texture as reference

        // For better alignment, we'll use coordinates that center on a visible landmass
        // These coordinates can be fine-tuned for perfect alignment

        // Default center (can be adjusted)
        const defaultCenter = [0, 0]; // [longitude, latitude]

        // You can fine-tune these coordinates for perfect alignment
        // Positive longitude = East, Negative = West
        // Positive latitude = North, Negative = South

        // For example, to center on Africa (good visible landmass):
        // return [20, 0]; // 20°E, 0°N (Central Africa)

        // For Europe:
        // return [15, 50]; // 15°E, 50°N (Central Europe)

        // For global view with equal land/ocean distribution:
        return defaultCenter;
    }

    // Method to update center calculation with custom coordinates
    updateEarthCenter(lng, lat) {
        // Store the custom center for future use
        this.customEarthCenter = [lng, lat];

        // Update the map if it exists
        if (this.mapTilerMap) {
            this.mapTilerMap.setCenter([lng, lat]);
            console.log(`Earth center updated to: [${lng}, ${lat}]`);
        }
    }

    // Method to get the current center (custom or calculated)
    getCurrentEarthCenter() {
        return this.customEarthCenter || this.calculateEarthCenter();
    }

    // Dynamic center calculation for perfect alignment
    async initMapTiler() {
        try {
            // Initialize MapTiler map using MapManager
            this.mapTilerMap = await this.mapManager.init(
                'maptiler-map',
                'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json',
                '8gl234ODD2pw5oJkzeVo'
            );

            // Start with interactions disabled
            this.enableMapInteractions(false);

            // Initialize PlacesManager
            this.placesManager = new PlacesManager(this.mapTilerMap);

            // Set places manager reference in UI manager
            this.uiManager.setPlacesManager(this.placesManager);

            // Add alignment tool for fine-tuning
            this.setupAlignmentTool();
        } catch (error) {
            console.error('Failed to initialize MapTiler:', error);
        }
    }

    // Setup alignment tool for fine-tuning map positioning
    setupAlignmentTool() {
        // Create alignment controls
        this.alignmentTool = document.createElement('div');
        this.alignmentTool.id = 'alignment-tool';
        this.alignmentTool.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                display: none;
            ">
                <h4 style="margin: 0 0 10px 0; color: #00ff00;">🎯 Map Alignment Tool</h4>
                <div style="margin-bottom: 5px;">
                    <label>Longitude: <input type="range" id="lng-slider" min="-180" max="180" step="0.01" value="0" style="width: 100px;"></label>
                    <span id="lng-value">0.00°</span>
                </div>
                <div style="margin-bottom: 5px;">
                    <label>Latitude: <input type="range" id="lat-slider" min="-90" max="90" step="0.01" value="0" style="width: 100px;"></label>
                    <span id="lat-value">0.00°</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Zoom: <input type="range" id="zoom-slider" min="1" max="10" step="0.01" value="4.11" style="width: 100px;"></label>
                    <span id="zoom-value">4.11</span>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="reset-alignment" style="padding: 5px 10px; background: #333; color: white; border: 1px solid #555; border-radius: 3px; cursor: pointer;">Reset</button>
                    <button id="copy-coords" style="padding: 5px 10px; background: #333; color: white; border: 1px solid #555; border-radius: 3px; cursor: pointer;">Copy</button>
                    <button id="hide-tool" style="padding: 5px 10px; background: #333; color: white; border: 1px solid #555; border-radius: 3px; cursor: pointer;">Hide</button>
                </div>
                <div style="margin-top: 10px; font-size: 10px; color: #888;">
                    Press 'M' to toggle this tool
                </div>
            </div>
        `;

        document.body.appendChild(this.alignmentTool);

        // Setup event listeners for the alignment tool
        const lngSlider = document.getElementById('lng-slider');
        const latSlider = document.getElementById('lat-slider');
        const zoomSlider = document.getElementById('zoom-slider');
        const lngValue = document.getElementById('lng-value');
        const latValue = document.getElementById('lat-value');
        const zoomValue = document.getElementById('zoom-value');
        const resetBtn = document.getElementById('reset-alignment');
        const copyBtn = document.getElementById('copy-coords');
        const hideBtn = document.getElementById('hide-tool');

        // Update map when sliders change
        const updateMap = () => {
            if (!this.mapTilerMap) return;

            const lng = parseFloat(lngSlider.value);
            const lat = parseFloat(latSlider.value);
            const zoom = parseFloat(zoomSlider.value);

            // Update display values
            lngValue.textContent = `${lng.toFixed(2)}°`;
            latValue.textContent = `${lat.toFixed(2)}°`;
            zoomValue.textContent = zoom.toFixed(2);

            // Update map center and zoom
            this.mapTilerMap.setCenter([lng, lat]);
            this.mapTilerMap.setZoom(zoom);

            console.log(`Map alignment updated: [${lng.toFixed(2)}, ${lat.toFixed(2)}], zoom: ${zoom.toFixed(2)}`);
        };

        lngSlider.addEventListener('input', updateMap);
        latSlider.addEventListener('input', updateMap);
        zoomSlider.addEventListener('input', updateMap);

        // Reset to original values
        resetBtn.addEventListener('click', () => {
            lngSlider.value = 0;
            latSlider.value = 0;
            zoomSlider.value = 4.11;
            updateMap();
        });

        // Copy coordinates to clipboard
        copyBtn.addEventListener('click', () => {
            const coords = `center: [${parseFloat(lngSlider.value).toFixed(2)}, ${parseFloat(latSlider.value).toFixed(2)}], zoom: ${parseFloat(zoomSlider.value).toFixed(2)}`;
            navigator.clipboard.writeText(coords).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy', 2000);

                // Also save to localStorage for persistence
                this.saveAlignmentSettings({
                    lng: parseFloat(lngSlider.value),
                    lat: parseFloat(latSlider.value),
                    zoom: parseFloat(zoomSlider.value)
                });
            });
        });

        // Hide tool
        hideBtn.addEventListener('click', () => {
            this.alignmentTool.style.display = 'none';
        });

        // Add keyboard shortcut to toggle tool
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                const isVisible = this.alignmentTool.style.display !== 'none';
                this.alignmentTool.style.display = isVisible ? 'none' : 'block';
                e.preventDefault();
            }
        });

        // Load saved alignment settings
        this.loadAlignmentSettings();

        console.log('Alignment tool setup complete. Press M to toggle.');
    }

    // Save alignment settings to localStorage
    saveAlignmentSettings(settings) {
        try {
            localStorage.setItem('earthMapAlignment', JSON.stringify(settings));
            console.log('Alignment settings saved:', settings);
        } catch (e) {
            console.warn('Could not save alignment settings:', e);
        }
    }

    // Load alignment settings from localStorage
    loadAlignmentSettings() {
        try {
            const saved = localStorage.getItem('earthMapAlignment');
            if (saved) {
                const settings = JSON.parse(saved);
                console.log('Loading saved alignment settings:', settings);

                // Apply saved settings to sliders
                const lngSlider = document.getElementById('lng-slider');
                const latSlider = document.getElementById('lat-slider');
                const zoomSlider = document.getElementById('zoom-slider');

                if (lngSlider && latSlider && zoomSlider) {
                    lngSlider.value = settings.lng || 0;
                    latSlider.value = settings.lat || 0;
                    zoomSlider.value = settings.zoom || 4.11;

                    // Update map with saved settings
                    if (this.mapTilerMap) {
                        this.mapTilerMap.setCenter([settings.lng || 0, settings.lat || 0]);
                        this.mapTilerMap.setZoom(settings.zoom || 4.11);
                    }
                }

                return settings;
            }
        } catch (e) {
            console.warn('Could not load alignment settings:', e);
        }
        return null;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Scroll events
        window.addEventListener('scroll', this.onScroll.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // UI events
        this.setupUIEvents();

        // Mobile touch handling
        this.setupMobileTouchHandling();

        // Easter egg controls
        this.setupEasterEggControls();
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

    setupMobileTouchHandling() {
        // Only apply mobile touch handling on mobile devices
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        if (!isMobile) return;

        let touchStartY = 0;
        let touchStartTime = 0;
        let isScrolling = false;

        // Prevent overscroll on touch devices
        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isScrolling = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            // Let modal overlays handle their own scrolling
            if (this.uiManager && this.uiManager.getState('portfolioIsVisible')) {
                return;
            }
            const showcaseOverlay = document.getElementById('showcase-overlay');
            if (showcaseOverlay && showcaseOverlay.classList.contains('visible')) {
                return;
            }
            const photoModal = document.querySelector('.photo-modal-overlay, .photo-gallery-modal-overlay');
            if (photoModal) {
                return;
            }

            if (!isScrolling) {
                isScrolling = true;
            }

            const currentY = e.touches[0].clientY;
            const deltaY = currentY - touchStartY;
            const currentScroll = window.pageYOffset;
            const maxScroll = this.scrollController.getMaxScroll();

            // Prevent overscroll at the top
            if (currentScroll <= 0 && deltaY > 0) {
                e.preventDefault();
                return false;
            }

            // Prevent overscroll at the bottom
            if (currentScroll >= maxScroll && deltaY < 0) {
                e.preventDefault();
                return false;
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            // If it was a quick tap (not a scroll), allow it
            if (touchDuration < 200 && !isScrolling) {
                return;
            }

            // Ensure we don't end up in an overscroll state
            const currentScroll = window.pageYOffset;
            const maxScroll = this.scrollController.getMaxScroll();

            if (currentScroll < 0) {
                window.scrollTo(0, 0);
            } else if (currentScroll > maxScroll) {
                window.scrollTo(0, maxScroll);
            }
        }, { passive: true });

        console.log('Mobile touch handling setup complete');
    }

    setupEasterEggControls() {
        // Keyboard shortcuts for fun features
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.code) {
                case 'KeyA':
                    // 'A' for Astronaut speed boost
                    if (this.earthScene.astronaut) {
                        this.earthScene.astronautOrbitSpeed *= 2;
                        this.showTooltip('🚀 Astronaut speed boost!', 2000);
                        setTimeout(() => {
                            this.earthScene.astronautOrbitSpeed /= 2; // Reset after 5 seconds
                        }, 5000);
                    }
                    break;

                case 'KeyS':
                    // 'S' for Shooting star shower
                    this.triggerShootingStarShower();
                    break;

                case 'KeyT':
                    // 'T' for Time warp (speed up everything)
                    this.toggleTimeWarp();
                    break;

                case 'KeyC':
                    // 'C' for Color mode
                    this.toggleColorMode();
                    break;

                case 'KeyF':
                    // 'F' for Fireworks
                    this.triggerFireworks();
                    break;

                case 'KeyH':
                    // 'H' for Help/shortcuts
                    this.showShortcutsHelp();
                    break;
            }
        });

        // Click interactions on the canvas
        this.renderer.domElement.addEventListener('click', (e) => {
            this.onCanvasClick(e);
        });

        // Initialize easter egg state
        this.timeWarpActive = false;
        this.colorModeIndex = 0;
        this.colorModes = [
            { name: 'Normal', filter: '' },
            { name: 'Retro', filter: 'sepia(0.8) saturate(1.5) hue-rotate(20deg)' },
            { name: 'Cyberpunk', filter: 'hue-rotate(200deg) saturate(2) contrast(1.2)' },
            { name: 'Matrix', filter: 'hue-rotate(90deg) saturate(2) brightness(0.8)' },
            { name: 'Warm', filter: 'hue-rotate(-20deg) saturate(1.3) brightness(1.1)' }
        ];
    }

    onCanvasClick(e) {
        // Get click position in normalized coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Create a ripple effect at click position
        this.createClickRipple(x, y);

        // Random chance for special effects on click
        if (Math.random() < 0.1) { // 10% chance
            const effects = ['sparkles', 'colorBurst', 'miniStar'];
            const effect = effects[Math.floor(Math.random() * effects.length)];
            this.triggerClickEffect(effect, x, y);
        }
    }

    createClickRipple(x, y) {
        // Create a visual ripple effect at the click location
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${(x + 1) * 50}%`;
        ripple.style.top = `${(-y + 1) * 50}%`;
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '1000';
        ripple.style.animation = 'rippleEffect 1s ease-out forwards';

        // Add CSS animation if not already added
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes rippleEffect {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(8);
                        opacity: 0;
                    }
                }
                
                @keyframes sparkleEffect {
                    0% { transform: scale(0) rotate(0deg); opacity: 1; }
                    50% { transform: scale(1) rotate(180deg); opacity: 1; }
                    100% { transform: scale(0) rotate(360deg); opacity: 0; }
                }
                
                .tooltip {
                    position: fixed;
                    top: 50px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-size: 16px;
                    z-index: 1001;
                    animation: fadeInOut 3s ease forwards;
                }
                
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    20% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    triggerClickEffect(effect, x, y) {
        switch (effect) {
            case 'sparkles':
                this.createSparkles(x, y);
                break;
            case 'colorBurst':
                this.createColorBurst(x, y);
                break;
            case 'miniStar':
                this.createMiniStar(x, y);
                break;
        }
    }

    createSparkles(x, y) {
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'fixed';
            sparkle.style.left = `${(x + 1) * 50 + (Math.random() - 0.5) * 20}%`;
            sparkle.style.top = `${(-y + 1) * 50 + (Math.random() - 0.5) * 20}%`;
            sparkle.style.width = '6px';
            sparkle.style.height = '6px';
            sparkle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
            sparkle.style.borderRadius = '50%';
            sparkle.style.transform = 'translate(-50%, -50%)';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1000';
            sparkle.style.animation = 'sparkleEffect 1.5s ease-out forwards';

            document.body.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1500);
        }
        this.showTooltip('✨ Sparkles!', 1500);
    }

    createColorBurst(x, y) {
        // Change the whole scene color temporarily
        const canvas = this.renderer.domElement;
        const originalFilter = canvas.style.filter;
        canvas.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(2)`;

        setTimeout(() => {
            canvas.style.filter = originalFilter;
        }, 500);

        this.showTooltip('🌈 Color burst!', 1500);
    }

    createMiniStar(x, y) {
        // Add a temporary star to the 3D scene at the click location
        if (this.earthScene.shootingStars) {
            this.earthScene.createShootingStar();
            this.showTooltip('⭐ Mini shooting star!', 2000);
        }
    }

    triggerShootingStarShower() {
        if (this.earthScene.shootingStars) {
            // Create multiple shooting stars rapidly
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.earthScene.createShootingStar();
                }, i * 200);
            }
            this.showTooltip('🌠 Shooting star shower!', 3000);
        }
    }

    toggleTimeWarp() {
        this.timeWarpActive = !this.timeWarpActive;

        if (this.timeWarpActive) {
            // Speed up all animations
            if (this.earthScene.astronaut) {
                this.originalAstronautSpeed = this.earthScene.astronautOrbitSpeed;
                this.earthScene.astronautOrbitSpeed *= 3;
            }
            if (this.earthScene.satellites) {
                this.originalSatelliteSpeeds = this.earthScene.satellites.map(sat => sat.orbitSpeed);
                this.earthScene.satellites.forEach(sat => sat.orbitSpeed *= 3);
            }
            this.showTooltip('⚡ Time warp activated!', 2000);
        } else {
            // Reset speeds
            if (this.earthScene.astronaut && this.originalAstronautSpeed) {
                this.earthScene.astronautOrbitSpeed = this.originalAstronautSpeed;
            }
            if (this.earthScene.satellites && this.originalSatelliteSpeeds) {
                this.earthScene.satellites.forEach((sat, i) => {
                    sat.orbitSpeed = this.originalSatelliteSpeeds[i];
                });
            }
            this.showTooltip('🕒 Time warp deactivated', 2000);
        }
    }

    toggleColorMode() {
        this.colorModeIndex = (this.colorModeIndex + 1) % this.colorModes.length;
        const mode = this.colorModes[this.colorModeIndex];

        const canvas = this.renderer.domElement;
        canvas.style.filter = mode.filter;

        this.showTooltip(`🎨 Color mode: ${mode.name}`, 2000);
    }

    triggerFireworks() {
        // Create a fireworks effect using particles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const x = (Math.random() - 0.5) * 2;
                const y = (Math.random() - 0.5) * 2;
                this.createFirework(x, y);
            }, i * 500);
        }
        this.showTooltip('🎆 Fireworks!', 3000);
    }

    createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const velocity = 3 + Math.random() * 2;

            particle.style.position = 'fixed';
            particle.style.left = `${(x + 1) * 50}%`;
            particle.style.top = `${(-y + 1) * 50}%`;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';

            const endX = Math.cos(angle) * velocity * 50;
            const endY = Math.sin(angle) * velocity * 50;

            particle.style.transition = 'all 1s ease-out';
            document.body.appendChild(particle);

            setTimeout(() => {
                particle.style.transform = `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`;
                particle.style.opacity = '0';
            }, 10);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    showShortcutsHelp() {
        if (this.closeHelp) {
            this.closeHelp();
            return;
        }

        const helpText = `
            🎮 Easter Egg Controls:
            A - Astronaut speed boost 🚀
            S - Shooting star shower 🌠
            T - Toggle time warp ⚡
            C - Change color mode 🎨
            F - Fireworks show 🎆
            H - Show this help 💡
            Click anywhere for surprises! ✨
                    `;

        const helpDiv = document.createElement('div');
        helpDiv.style.position = 'fixed';
        helpDiv.style.top = '50%';
        helpDiv.style.left = '50%';
        helpDiv.style.transform = 'translate(-50%, -50%)';
        helpDiv.style.background = 'rgba(0, 0, 0, 0.9)';
        helpDiv.style.color = 'white';
        helpDiv.style.padding = '30px';
        helpDiv.style.borderRadius = '15px';
        helpDiv.style.zIndex = '1002';
        helpDiv.style.fontSize = '16px';
        helpDiv.style.lineHeight = '1.6';
        helpDiv.style.textAlign = 'center';
        helpDiv.style.whiteSpace = 'pre-line';
        helpDiv.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        helpDiv.textContent = helpText;

        this.closeHelp = () => {
            if (helpDiv.parentNode) {
                helpDiv.remove();
            }
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('keydown', keyHandler);
            this.closeHelp = null;
        };

        const clickHandler = () => {
            this.closeHelp();
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeHelp();
            }
        };

        // Delay attaching listeners to prevent immediate triggering
        setTimeout(() => {
            if (this.closeHelp) {
                document.addEventListener('click', clickHandler);
                document.addEventListener('keydown', keyHandler);
            }
        }, 10);

        document.body.appendChild(helpDiv);

        // Auto-close after 8 seconds
        setTimeout(() => {
            if (this.closeHelp) {
                this.closeHelp();
            }
        }, 8000);
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

        // Update earth transformation
        this.earthScene.updateTransformation(scrollProgress);

        // Control Google Earth fade-in
        this.updateGoogleEarthVisibility(scrollProgress);

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
    updateUIOnScroll(progress) {
        // Handle scroll indicator and skip button visibility
        if (!this.uiManager.getState('isAutoScrolling')) {
            if (window.pageYOffset > 50) {
                this.uiManager.hideElement('scrollIndicator');
                this.uiManager.hideElement('skipButton');
                this.uiManager.hideElement('showcaseBtn');
            } else if (window.pageYOffset <= 10 && !this.uiManager.getState('hasCompletedMapJourney')) {
                this.uiManager.showElement('scrollIndicator');
                this.uiManager.showElement('skipButton');
                this.uiManager.showElement('showcaseBtn');
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

    updateGoogleEarthVisibility(progress) {
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

                const animationThreshold = isMobile ? 0.95 : 1.0;
                if (fadeProgress >= animationThreshold && !this.uiManager.getState('hasZoomedToErbil')) {
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
        this.uiManager.hideElement('showcaseBtn');

        if (this.uiManager.getState('portfolioHasBeenShown') && this.uiManager.getState('portfolioManuallyDismissed')) {
            this.uiManager.showElement('reopenPortfolioBtn');
        } else {
            this.uiManager.hideElement('reopenPortfolioBtn');
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

    startAutoScroll() {
        if (this.isAutoScrolling) return;

        console.log('Starting auto-scroll animation');
        this.isAutoScrolling = true;

        // Update indicator appearance and hide skip button
        this.scrollIndicator.classList.add('animating');
        this.skipButton.classList.add('hidden');
        if (this.showcaseBtn) this.showcaseBtn.classList.add('hidden');

        // Get the maximum scroll distance
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const duration = 12000; // 12 seconds for the entire scroll animation
        const startTime = Date.now();
        const startScroll = window.pageYOffset;

        // Get progress fill element
        const progressFill = document.querySelector('.progress-fill');

        const animateScroll = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Update progress bar
            progressFill.style.width = `${progress * 100}%`;

            // Use smooth easing for natural scroll feel
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
        this.isAutoScrolling = false;

        // Hide the indicator completely after animation
        this.scrollIndicator.classList.add('hidden');
        this.scrollIndicator.classList.remove('animating');

        // Reset progress bar
        const progressFill = document.querySelector('.progress-fill');
        progressFill.style.width = '0%';

        if (this.autoScrollAnimation) {
            cancelAnimationFrame(this.autoScrollAnimation);
            this.autoScrollAnimation = null;
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
        }
    }

    hidePortfolio() {
        console.log('🔴 hidePortfolio() called');
        console.log('🔴 FlyTo animation completed flag:', this.flyToAnimationCompleted);
        console.log('🔴 Has zoomed to Erbil:', this.hasZoomedToErbil);
        console.log('🔴 Has completed map journey:', this.hasCompletedMapJourney);

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
        if (this.hasCompletedMapJourney && this.portfolioHasBeenShown && this.portfolioManuallyDismissed) {
            setTimeout(() => {
                // Check if maptile map is visible before showing the button
                const googleEarthContainer = this.uiManager.getElement('googleEarthContainer');
                const isMapTileVisible = googleEarthContainer &&
                    googleEarthContainer.classList.contains('visible') &&
                    parseFloat(googleEarthContainer.style.opacity) > 0;

                console.log('Portfolio closed - scroll progress:', scrollProgress, 'hasCompleted:', this.hasCompletedMapJourney, 'wasAutoShown:', this.portfolioHasBeenShown, 'isMapTileVisible:', isMapTileVisible);

                if (isMapTileVisible) {
                    const reopenPortfolioBtn = this.uiManager.getElement('reopenPortfolioBtn');
                    if (reopenPortfolioBtn) {
                        reopenPortfolioBtn.classList.add('visible');
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
                    }
                }, 300); // Small delay for smooth transition
            }
        }

        console.log('Portfolio hidden, flags - flyToCompleted:', this.flyToAnimationCompleted, 'hasZoomed:', this.hasZoomedToErbil);
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

        // Hide places list immediately
        if (this.placesManager) {
            this.placesManager.setPlacesListVisibility(false);
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

        // Show the initial UI elements after a delay
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
            }
        }, 1000); // Give time for scroll animation to complete
    }

    lockScroll() {
        // Store current scroll position
        this.scrollPosition = window.pageYOffset;
        console.log('🔒 lockScroll() - storing scroll position:', this.scrollPosition);

        // Apply scroll lock styles
        document.body.style.position = 'fixed';
        document.body.style.top = `-${this.scrollPosition}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Prevent scroll via keyboard
        this.preventScrollKeys = (e) => {
            // Prevent arrow keys, spacebar, page up/down from scrolling
            if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        };

        document.addEventListener('keydown', this.preventScrollKeys, { passive: false });

        console.log('Background scroll locked');
    }

    unlockScroll() {
        // Remove scroll lock styles
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // Remove keyboard event listener
        if (this.preventScrollKeys) {
            document.removeEventListener('keydown', this.preventScrollKeys);
            this.preventScrollKeys = null;
        }

        // Only restore scroll position if we're not in the MapTiler view
        // If we're in the MapTiler view (scroll progress > 0.5), stay at current position
        const scrollProgress = this.scrollController.getScrollProgress();
        const currentScroll = window.pageYOffset;

        console.log('🔵 unlockScroll() - scroll progress:', scrollProgress, 'current scroll:', currentScroll, 'stored scroll:', this.scrollPosition);

        if (scrollProgress <= 0.5) {
            // Restore scroll position only if we're not in the MapTiler view
            // If stored scroll position is undefined, use current position
            const targetScroll = this.scrollPosition !== undefined ? this.scrollPosition : currentScroll;
            console.log('🔵 unlockScroll() - restoring scroll to:', targetScroll);
            window.scrollTo(0, targetScroll);
        } else {
            console.log('🔵 unlockScroll() - staying at current position:', currentScroll, '(MapTiler view)');
        }
        // If scrollProgress > 0.5, we're in MapTiler view, so don't change scroll position

        console.log('Background scroll unlocked, scroll progress:', scrollProgress);
    }

    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
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


    resetMapTileMap() {
        console.log('🟡 resetMapTileMap() called - THIS SHOULD NOT HAPPEN WHEN PORTFOLIO IS CLOSED');
        console.trace('🟡 resetMapTileMap() call stack:');

        this.mapManager.reset();
        this.uiManager.setState('hasZoomedToErbil', false);
    }


    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update earth scene
        this.earthScene.update();

        // Render
        this.renderer.render(this.earthScene.scene, this.earthScene.camera);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
