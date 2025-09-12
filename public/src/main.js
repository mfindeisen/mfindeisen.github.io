import * as THREE from '/three/build/three.module.js';
import { EarthScene } from './EarthScene.js';
import { ScrollController } from './ScrollController.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scrollProgress = document.getElementById('scroll-progress');
        this.googleEarthContainer = document.getElementById('google-earth-container');
        this.scrollIndicator = document.getElementById('scroll-indicator');
        this.portfolioOverlay = document.getElementById('portfolio-overlay');
        this.skipButton = document.getElementById('skip-button');
        this.reopenPortfolioBtn = document.getElementById('reopen-portfolio-btn');
        this.backToBeginningBtn = document.getElementById('back-to-beginning-btn');
        this.footer = document.getElementById('footer');
        
        this.hasZoomedToErbil = false;
        this.hasCompletedMapJourney = false;
        this.portfolioHasBeenShown = false; // Track if portfolio was shown automatically
        this.portfolioManuallyDismissed = false; // Track if user manually closed it
        this.flyToAnimationCompleted = false; // Track if flyTo animation has completed
        this.isAtBeginning = false; // Track if user is at the beginning
        this.beginningTimer = null; // Timer for sustained beginning detection
        this.mapTilerMap = null;
        this.isAutoScrolling = false;
        this.autoScrollAnimation = null;
        this.portfolioIsVisible = false; // Track if portfolio is currently visible
        
        // Reset scroll position to 0 on page load/reload
        this.resetScrollPosition();
        
        this.init();
        this.initMapTiler();
        this.setupEventListeners();
        this.animate();
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

    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false 
        });
        this.renderer.setClearColor(0x000000); // Black space background
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Create earth scene
        this.earthScene = new EarthScene();
        
        // Create scroll controller
        this.scrollController = new ScrollController();
        
        console.log('Three.js App initialized');
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
    initMapTiler() {
        // Calculate the center point of the 3D Earth model
        const earthCenter = this.calculateEarthCenter();
        
        // Initialize MapTiler map with calculated center
        this.mapTilerMap = new maplibregl.Map({
            container: 'maptiler-map',
            style: 'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json?key=6xZpq7YqiHrgv1PNVwTM',
            center: earthCenter, // Calculated coordinates [lng, lat]
            zoom: 4.11, // Starting zoom level
            interactive: false // Start with interactions disabled
        });

        this.mapTilerMap.on('load', () => {
            console.log('MapTiler map loaded with center:', earthCenter);
            // Start with interactions disabled
            this.enableMapInteractions(false);
            
            // Add alignment tool for fine-tuning
            this.setupAlignmentTool();
        });
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
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle scroll
        window.addEventListener('scroll', this.onScroll.bind(this));
        
        // Handle scroll indicator click
        this.scrollIndicator.addEventListener('click', this.startAutoScroll.bind(this));
        
        // Mobile touch event handling to prevent overscroll issues
        this.setupMobileTouchHandling();
        
        // Handle portfolio overlay close
        const closeBtn = document.querySelector('.close-portfolio');
        closeBtn.addEventListener('click', this.hidePortfolio.bind(this));
        
        // Close portfolio when clicking outside the content
        this.portfolioOverlay.addEventListener('click', (e) => {
            if (e.target === this.portfolioOverlay) {
                this.hidePortfolio();
            }
        });
        
        // Handle skip to portfolio button
        this.skipButton.addEventListener('click', this.skipToPortfolio.bind(this));
        
        // Handle reopen portfolio button
        this.reopenPortfolioBtn.addEventListener('click', this.showPortfolio.bind(this));
        
        // Handle back to beginning button
        this.backToBeginningBtn.addEventListener('click', this.backToBeginning.bind(this));
        
        // Add fun easter egg interactions
        this.setupEasterEggControls();
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
            
            switch(e.code) {
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
        switch(effect) {
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
        
        // Close on click
        helpDiv.addEventListener('click', () => helpDiv.remove());
        
        document.body.appendChild(helpDiv);
        setTimeout(() => helpDiv.remove(), 8000);
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
        console.log('Scroll event triggered, progress:', scrollProgress);
        this.scrollProgress.textContent = `Progress: ${Math.round(scrollProgress * 100)}%`;
        
        // Mobile scroll boundary protection - prevent scrolling past transformation completion
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        if (isMobile && scrollProgress >= 1.0) {
            // If we've reached 100% progress on mobile, prevent further scrolling
            const maxScroll = this.scrollController.getMaxScroll();
            const currentScroll = window.pageYOffset;
            
            // If user tries to scroll past the maximum, snap back to the maximum
            if (currentScroll > maxScroll) {
                window.scrollTo(0, maxScroll);
                return; // Exit early to prevent further processing
            }
        }
        
        // Handle scroll indicator and skip button visibility
        if (!this.isAutoScrolling) {
            if (window.pageYOffset > 50) {
                // Hide when scrolling down
                this.scrollIndicator.classList.add('hidden');
                this.skipButton.classList.add('hidden');
            } else if (window.pageYOffset <= 10 && !this.hasCompletedMapJourney) {
                // Show again when scrolling back to top (only if haven't completed map journey)
                this.scrollIndicator.classList.remove('hidden');
                this.skipButton.classList.remove('hidden');
                // Hide back to beginning button when at the top
                this.backToBeginningBtn.classList.add('hidden');
            }
        }
        
        // Check if maptile map is visible
        const isMapTileVisible = this.googleEarthContainer && 
                                 this.googleEarthContainer.classList.contains('visible') && 
                                 parseFloat(this.googleEarthContainer.style.opacity) > 0;
        
        // Show reopen portfolio button when maptile map is visible AND portfolio was auto-shown and dismissed
        if (isMapTileVisible && this.reopenPortfolioBtn && this.portfolioHasBeenShown && this.portfolioManuallyDismissed) {
            this.reopenPortfolioBtn.classList.add('visible');
            console.log('✅ onScroll: Showing reopen portfolio button - all conditions met');
        } else if (this.reopenPortfolioBtn) {
            // Hide the button if conditions are not met
            this.reopenPortfolioBtn.classList.remove('visible');
            if (isMapTileVisible) {
                console.log('❌ onScroll: Hiding reopen portfolio button - conditions not met:', {
                    hasBeenShown: this.portfolioHasBeenShown,
                    manuallyDismissed: this.portfolioManuallyDismissed
                });
            }
        }
        
        // Show back to beginning button when at the end and have completed the journey
        // Temporarily using 0.95 instead of 0.95 for easier testing
        if (scrollProgress > 0.95 && this.hasCompletedMapJourney && !this.portfolioOverlay.classList.contains('visible') && this.backToBeginningBtn) {
            console.log('Should show back to beginning button - progress:', scrollProgress);
            this.backToBeginningBtn.classList.remove('hidden'); // Show by removing hidden class
        } else if (scrollProgress <= 0.95 && this.hasCompletedMapJourney && this.backToBeginningBtn && !isMapTileVisible) {
            // Hide the button when not at the end (but only if journey completed) AND maptile map is not visible
            this.backToBeginningBtn.classList.add('hidden');
        }
        
        
        // Test with a simple progress value
        const testProgress = Math.min(window.pageYOffset / 1000, 1); // Simple test
        console.log('Test progress:', testProgress);
        
        // Update earth transformation based on scroll
        this.earthScene.updateTransformation(scrollProgress);
        
        // Control Google Earth fade-in
        this.updateGoogleEarthVisibility(scrollProgress);
    }

    updateGoogleEarthVisibility(progress) {
        console.log('🔵 updateGoogleEarthVisibility() called with progress:', progress);
        console.trace('🔵 updateGoogleEarthVisibility() call stack:');
        
        // Start loading MapTiler early for smooth transition
        if (progress > 0.5) {
            // Pre-load MapTiler but keep it invisible and behind
            this.googleEarthContainer.style.zIndex = '0';
            this.googleEarthContainer.style.opacity = 0;
            
            // Use the perfect alignment point discovered: cross-fade at 0.37 opacity (progress 0.968)
            const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
            const activationThreshold = isMobile ? 0.90 : 0.968; // Use the perfect alignment point
            const fadeRange = isMobile ? 0.10 : 0.032; // Shorter fade range to maintain perfect alignment
            
            if (progress > activationThreshold) {
                const fadeProgress = Math.min((progress - activationThreshold) / fadeRange, 1.0);
                
                // Start cross-fade: bring MapTiler to front and make it visible
                this.googleEarthContainer.style.zIndex = '2'; // Bring to front
                this.googleEarthContainer.style.opacity = fadeProgress;
                this.googleEarthContainer.classList.add('visible');
                
                // Hide all background elements as soon as maptile map becomes visible
                this.hideBackgroundElements(fadeProgress);
                
                // Add margin to footer when map becomes visible
                if (fadeProgress >= 0.5) {
                    this.footer.style.marginBottom = '20px';
                }
                
                // When fade is complete, zoom to Erbil
                // Use the perfect alignment threshold to trigger zoom at the right moment
                const animationThreshold = isMobile ? 0.95 : 1.0; // Keep at 1.0 to trigger after perfect cross-fade
                if (fadeProgress >= animationThreshold && !this.hasZoomedToErbil) {
                    console.log('Triggering Erbil animation - fadeProgress:', fadeProgress, 'threshold:', animationThreshold, 'isMobile:', isMobile);
                    this.zoomToErbil();
                    this.hasZoomedToErbil = true;
                }
                
                console.log('Cross-fade progress:', fadeProgress, 'MapTiler opacity:', fadeProgress, 'Threshold:', activationThreshold, 'isMobile:', isMobile);
            }
        } else {
            // Keep MapTiler completely hidden in early stages
            this.googleEarthContainer.style.zIndex = '0';
            this.googleEarthContainer.style.opacity = 0;
            this.googleEarthContainer.classList.remove('visible');
            
            // Show all background elements when maptile map is not visible
            this.showBackgroundElements();
            
            // Remove footer margin when not showing map
            this.footer.style.marginBottom = '';
            
            // When scrolling back up, reset flags and map position
            // Only reset if we're actually scrolling from a high position (not just portfolio closing)
            console.log('🔵 updateGoogleEarthVisibility() - checking reset conditions:');
            console.log('🔵 hasZoomedToErbil:', this.hasZoomedToErbil);
            console.log('🔵 progress:', progress);
            console.log('🔵 progress < 0.3:', progress < 0.3);
            console.log('🔵 portfolioIsVisible:', this.portfolioIsVisible);
            console.log('🔵 condition (hasZoomedToErbil && progress < 0.3 && !portfolioIsVisible):', this.hasZoomedToErbil && progress < 0.3 && !this.portfolioIsVisible);
            
            if (this.hasZoomedToErbil && progress < 0.3 && !this.portfolioIsVisible) {
                console.log('🔵 User scrolled back up from high position - resetting flags and map position');
                
                // Reset the maptile map to its original state
                this.resetMapTileMap();
                
                // Reset completion status so animation can run again
                this.hasCompletedMapJourney = false;
                
                // Don't reset portfolio flags here - only reset when user goes to very beginning
                // This allows portfolio to reopen if user scrolls back down without going to top
                
                console.log('🔵 Flags and map position reset (portfolio flags preserved)');
            } else {
                console.log('🔵 NOT resetting map - conditions not met');
                if (this.portfolioIsVisible) {
                    console.log('🔵 Portfolio is visible - preventing map reset');
                }
            }
            
            // Reset zoom flag when going back
            this.hasZoomedToErbil = false;
            
            // Only reset flyTo flag and portfolio flags when user stays at the very beginning for an extended period
            // This indicates they want a completely fresh start
            if (progress < 0.005) {
                if (!this.isAtBeginning) {
                    this.isAtBeginning = true;
                    this.beginningTimer = setTimeout(() => {
                        if (this.isAtBeginning && progress < 0.005) {
                            this.flyToAnimationCompleted = false;
                            // Reset portfolio flags only when user stays at very beginning for extended period
                            this.portfolioHasBeenShown = false;
                            this.portfolioManuallyDismissed = false;
                            console.log('Reset flyTo completion flag and portfolio flags - user wants fresh start');
                        }
                    }, 3000); // 3 second delay for intentional reset
                }
            } else if (progress >= 0.01) {
                this.isAtBeginning = false;
                if (this.beginningTimer) {
                    clearTimeout(this.beginningTimer);
                    this.beginningTimer = null;
                }
            }
        }
    }

    hideBackgroundElements(fadeProgress) {
        // Hide the 3D Earth scene (canvas container) as soon as maptile map becomes visible
        if (this.container) {
            this.container.style.opacity = Math.max(0, 1 - fadeProgress * 2); // Fade out quickly
            this.container.style.pointerEvents = 'none'; // Disable interactions
        }
        
        // Hide scroll indicator
        if (this.scrollIndicator) {
            this.scrollIndicator.classList.add('hidden');
        }
        
        // Hide skip button
        if (this.skipButton) {
            this.skipButton.classList.add('hidden');
        }
        
        // Show reopen portfolio button only if portfolio was auto-shown and dismissed
        if (this.reopenPortfolioBtn && this.portfolioHasBeenShown && this.portfolioManuallyDismissed) {
            this.reopenPortfolioBtn.classList.add('visible');
            console.log('✅ hideBackgroundElements: Showing reopen portfolio button - all conditions met');
        } else if (this.reopenPortfolioBtn) {
            this.reopenPortfolioBtn.classList.remove('visible');
            console.log('❌ hideBackgroundElements: Hiding reopen portfolio button - conditions not met:', {
                hasBeenShown: this.portfolioHasBeenShown,
                manuallyDismissed: this.portfolioManuallyDismissed
            });
        }
        
        if (this.backToBeginningBtn) {
            this.backToBeginningBtn.classList.remove('hidden');
        }
        
        // Hide info panel (scroll progress)
        const infoPanel = document.querySelector('.info');
        if (infoPanel) {
            infoPanel.style.opacity = Math.max(0, 1 - fadeProgress * 2);
        }
        
        console.log('Background elements hidden - fadeProgress:', fadeProgress);
    }

    showBackgroundElements() {
        // Show the 3D Earth scene (canvas container)
        if (this.container) {
            this.container.style.opacity = '1';
            this.container.style.pointerEvents = 'auto';
        }
        
        // Show info panel (scroll progress)
        const infoPanel = document.querySelector('.info');
        if (infoPanel) {
            infoPanel.style.opacity = '1';
        }
        
        // Note: Other elements (scroll indicator, buttons, footer) are controlled by other logic
        // and will be shown/hidden based on scroll position and other conditions
        
        console.log('Background elements shown');
    }

    startAutoScroll() {
        if (this.isAutoScrolling) return;
        
        console.log('Starting auto-scroll animation');
        this.isAutoScrolling = true;
        
        // Update indicator appearance and hide skip button
        this.scrollIndicator.classList.add('animating');
        this.skipButton.classList.add('hidden');
        
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
        this.portfolioOverlay.classList.add('visible');
        this.portfolioIsVisible = true; // Set flag to prevent map resets
        
        // Hide reopen button when portfolio is shown
        this.reopenPortfolioBtn.classList.remove('visible');
        
        // Hide back to beginning button when portfolio is shown
        this.backToBeginningBtn.classList.add('hidden');
        
        // Keep footer visible when portfolio is open
        // (removed footer hiding)
        
        // Ensure maptile map is hidden when portfolio is shown
        if (this.googleEarthContainer) {
            this.googleEarthContainer.style.opacity = '0';
            this.googleEarthContainer.style.zIndex = '0';
            this.googleEarthContainer.classList.remove('visible');
        }
        
        // Prevent background scrolling
        this.lockScroll();
    }
    
    hidePortfolio() {
        console.log('🔴 hidePortfolio() called');
        console.log('🔴 FlyTo animation completed flag:', this.flyToAnimationCompleted);
        console.log('🔴 Has zoomed to Erbil:', this.hasZoomedToErbil);
        console.log('🔴 Has completed map journey:', this.hasCompletedMapJourney);
        
        this.portfolioOverlay.classList.remove('visible');
        this.portfolioIsVisible = false; // Clear flag to allow map resets again
        
        // Mark that user manually dismissed the portfolio
        this.portfolioManuallyDismissed = true;
        
        // Restore background scrolling
        this.unlockScroll();
        
        // Footer remains visible (no need to restore)
        
        // Restore maptile map visibility if we're at the right scroll position
        const scrollProgress = this.scrollController.getScrollProgress();
        console.log('🔴 hidePortfolio() - scroll progress:', scrollProgress);
        
        if (scrollProgress > 0.5) {
            console.log('🔴 hidePortfolio() - restoring map visibility WITHOUT calling updateGoogleEarthVisibility');
            // Simply restore the map visibility without calling updateGoogleEarthVisibility
            // to avoid resetting the map position
            this.googleEarthContainer.style.opacity = '1';
            this.googleEarthContainer.style.zIndex = '2';
            this.googleEarthContainer.classList.add('visible');
            
            // Hide background elements to show the map
            this.hideBackgroundElements(1.0);
            console.log('🔴 hidePortfolio() - map visibility restored, should stay at Erbil coordinates');
        } else {
            console.log('🔴 hidePortfolio() - scroll progress too low, not restoring map');
        }
        
        // Only show reopen portfolio button if we've completed the map journey AND portfolio was auto-shown
        if (this.hasCompletedMapJourney && this.portfolioHasBeenShown) {
            setTimeout(() => {
                // Check if maptile map is visible before showing the button
                const isMapTileVisible = this.googleEarthContainer && 
                                         this.googleEarthContainer.classList.contains('visible') && 
                                         parseFloat(this.googleEarthContainer.style.opacity) > 0;
                
                console.log('Portfolio closed - scroll progress:', scrollProgress, 'hasCompleted:', this.hasCompletedMapJourney, 'wasAutoShown:', this.portfolioHasBeenShown, 'isMapTileVisible:', isMapTileVisible);
                
                if (isMapTileVisible) {
                    this.reopenPortfolioBtn.classList.add('visible');
                    console.log('✅ Showing reopen portfolio button - all conditions met');
                } else {
                    console.log('❌ Not showing reopen portfolio button - maptile map not visible');
                }
                
                // Also show back to beginning button if we're at the end
                if (scrollProgress > 0.95 && this.backToBeginningBtn) {
                    console.log('Showing back to beginning button after portfolio close');
                    this.backToBeginningBtn.classList.remove('hidden'); // Show by removing hidden class
                    console.log('Button classes after show:', this.backToBeginningBtn.className);
                }
            }, 300); // Small delay for smooth transition
        } else {
            // If we haven't completed the map journey and we're at the top, show the initial buttons
            if (window.pageYOffset <= 10) {
                setTimeout(() => {
                    this.scrollIndicator.classList.remove('hidden');
                    this.skipButton.classList.remove('hidden');
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
        this.skipButton.classList.add('hidden');
        this.scrollIndicator.classList.add('hidden');
        
        // Show portfolio overlay immediately
        this.showPortfolio();
    }
    
    backToBeginning() {
        console.log('🟢 backToBeginning() called - THIS IS THE CORRECT WAY TO RESET THE MAP');
        
        // Hide the back to beginning button immediately
        this.backToBeginningBtn.classList.add('hidden');
        
        // Reset the maptile map to its original state
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
        
        // Show the initial UI elements after a delay
        setTimeout(() => {
            this.scrollIndicator.classList.remove('hidden');
            this.skipButton.classList.remove('hidden');
        }, 1000); // Give time for scroll animation to complete
    }
    
    lockScroll() {
        // Store current scroll position
        this.scrollPosition = window.pageYOffset;
        
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
        
        // Restore scroll position
        window.scrollTo(0, this.scrollPosition);
        
        console.log('Background scroll unlocked');
    }
    
    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    zoomToErbil() {
        if (!this.mapTilerMap) {
            console.error('MapTiler map not initialized');
            return;
        }

        // If animation already completed, don't start again
        if (this.flyToAnimationCompleted) {
            console.log('FlyTo animation already completed, skipping');
            return;
        }

        console.log('Starting smooth flyTo animation to Erbil, Iraq');
        
        // Target coordinates (Erbil, Iraq)
        const targetLng = 44.0259;
        const targetLat = 36.1982;
        const targetZoom = 13;
        
        // Set animation start time to prevent duplicate triggers
        this.flyToStartTime = Date.now();
        
        // Use MapTiler SDK's native flyTo method for smooth animation
        this.mapTilerMap.flyTo({
            center: [targetLng, targetLat], // [longitude, latitude]
            zoom: targetZoom,
            duration: 8000, // 8 seconds for slower, more cinematic feel
            essential: true // Animation cannot be interrupted
        });

        // Use timeout instead of moveend event to avoid duplicate triggers
        setTimeout(() => {
            // Only run this logic if the flyTo animation hasn't completed yet
            if (!this.flyToAnimationCompleted) {
                this.flyToAnimationCompleted = true; // Mark animation as completed
                
                // Enable map interactions after animation completes
                this.enableMapInteractions(true);
                console.log('Zoom to Erbil completed at coordinates:', targetLat, targetLng, 'zoom:', targetZoom);
                
                // Mark that we've completed the full map journey
                this.hasCompletedMapJourney = true;
                
                // Show portfolio overlay after a brief delay (only if not shown before and not manually dismissed)
                if (!this.portfolioHasBeenShown && !this.portfolioManuallyDismissed) {
                    setTimeout(() => {
                        this.showPortfolio();
                        this.portfolioHasBeenShown = true; // Mark as shown
                    }, 2000); // 2 second delay to let user appreciate the map
                }
            }
        }, 8500); // Wait for animation to complete (8s + 500ms buffer)
    }
    
    enableMapInteractions(enable) {
        if (!this.mapTilerMap) return;
        
        if (enable) {
            // Enable all map interactions
            this.mapTilerMap.dragPan.enable();
            this.mapTilerMap.scrollZoom.enable();
            this.mapTilerMap.doubleClickZoom.enable();
            this.mapTilerMap.touchZoomRotate.enable();
            console.log('Map interactions enabled');
        } else {
            // Disable all map interactions
            this.mapTilerMap.dragPan.disable();
            this.mapTilerMap.scrollZoom.disable();
            this.mapTilerMap.doubleClickZoom.disable();
            this.mapTilerMap.touchZoomRotate.disable();
            console.log('Map interactions disabled');
        }
    }
    
    resetMapTileMap() {
        console.log('🟡 resetMapTileMap() called - THIS SHOULD NOT HAPPEN WHEN PORTFOLIO IS CLOSED');
        console.trace('🟡 resetMapTileMap() call stack:');
        
        if (!this.mapTilerMap) {
            console.warn('🟡 MapTiler map not initialized, cannot reset');
            return;
        }
        
        console.log('🟡 Resetting maptile map to original state');
        
        // Get the original center coordinates
        const originalCenter = this.getCurrentEarthCenter();
        const originalZoom = 4.11; // Original zoom level from initMapTiler
        
        // Reset map to original position and zoom
        this.mapTilerMap.setCenter(originalCenter);
        this.mapTilerMap.setZoom(originalZoom);
        
        // Disable map interactions to match original state
        this.enableMapInteractions(false);
        
        // Reset any ongoing animations by stopping them
        if (this.mapTilerMap.isMoving()) {
            this.mapTilerMap.stop();
        }
        
        console.log('🟡 Maptile map reset to center:', originalCenter, 'zoom:', originalZoom);
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
