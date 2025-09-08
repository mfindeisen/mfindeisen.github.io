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

    // 4.11/-6.74/-4.05
    initMapTiler() {
        // Initialize MapTiler map with global view
        this.mapTilerMap = new maplibregl.Map({
            container: 'maptiler-map',
            style: 'https://api.maptiler.com/maps/0199257a-01d6-7358-b3cb-99a4e119c9cb/style.json?key=6xZpq7YqiHrgv1PNVwTM',
            center: [-6.58, -4.05], // Starting coordinates [lng, lat]
            zoom: 4.11, // Starting zoom level
            interactive: false // Start with interactions disabled
        });

        this.mapTilerMap.on('load', () => {
            console.log('MapTiler map loaded');
            // Start with interactions disabled
            this.enableMapInteractions(false);
        });
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle scroll
        window.addEventListener('scroll', this.onScroll.bind(this));
        
        // Handle scroll indicator click
        this.scrollIndicator.addEventListener('click', this.startAutoScroll.bind(this));
        
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
            }
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
        // Start loading MapTiler early for smooth transition
        if (progress > 0.5) {
            // Pre-load MapTiler but keep it invisible and behind
            this.googleEarthContainer.style.zIndex = '0';
            this.googleEarthContainer.style.opacity = 0;
            
            // Lower threshold for mobile compatibility (90% instead of 95%)
            const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
            const activationThreshold = isMobile ? 0.90 : 0.95;
            const fadeRange = isMobile ? 0.10 : 0.05; // Longer fade on mobile
            
            if (progress > activationThreshold) {
                const fadeProgress = Math.min((progress - activationThreshold) / fadeRange, 1.0);
                
                // Start cross-fade: bring MapTiler to front and make it visible
                this.googleEarthContainer.style.zIndex = '2'; // Bring to front
                this.googleEarthContainer.style.opacity = fadeProgress;
                this.googleEarthContainer.classList.add('visible');
                
                // Add margin to footer when map becomes visible
                if (fadeProgress >= 0.5) {
                    this.footer.style.marginBottom = '20px';
                }
                
                // When fade is complete, zoom to Erbil
                // Use a slightly lower threshold on mobile to ensure animation triggers
                const animationThreshold = isMobile ? 0.95 : 1.0;
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
            
            // Remove footer margin when not showing map
            this.footer.style.marginBottom = '';
            
            // When scrolling back up, just reset flags but keep map position
            if (this.hasZoomedToErbil) {
                console.log('User scrolled back up - resetting flags but keeping map position');
                
                // Reset completion status so animation can run again
                this.hasCompletedMapJourney = false;
                
                // Reset portfolio flags so it can show again if user goes through the full journey
                this.portfolioHasBeenShown = false;
                this.portfolioManuallyDismissed = false;
                // Don't reset flyToAnimationCompleted here - only reset when actually starting new animation
                
                console.log('Flags reset, map position maintained');
            }
            
            // Reset zoom flag when going back
            this.hasZoomedToErbil = false;
            
            // Only reset flyTo flag when user stays at the very beginning for an extended period
            // This indicates they want a completely fresh start
            if (progress < 0.005) {
                if (!this.isAtBeginning) {
                    this.isAtBeginning = true;
                    this.beginningTimer = setTimeout(() => {
                        if (this.isAtBeginning && progress < 0.005) {
                            this.flyToAnimationCompleted = false;
                            console.log('Reset flyTo completion flag - user wants fresh start');
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
        
        // Hide reopen button when portfolio is shown
        this.reopenPortfolioBtn.classList.remove('visible');
        
        // Hide footer when portfolio is open
        this.footer.classList.add('hidden');
        
        // Prevent background scrolling
        this.lockScroll();
    }
    
    hidePortfolio() {
        console.log('Hiding portfolio overlay');
        console.log('FlyTo animation completed flag:', this.flyToAnimationCompleted);
        console.log('Has zoomed to Erbil:', this.hasZoomedToErbil);
        
        this.portfolioOverlay.classList.remove('visible');
        
        // Mark that user manually dismissed the portfolio
        this.portfolioManuallyDismissed = true;
        
        // Restore background scrolling
        this.unlockScroll();
        
        // Show footer again when portfolio is closed
        this.footer.classList.remove('hidden');
        
        // Only show reopen portfolio button if we've completed the map journey
        if (this.hasCompletedMapJourney) {
            setTimeout(() => {
                this.reopenPortfolioBtn.classList.add('visible');
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
        
        // Hide the skip button and scroll indicator
        this.skipButton.classList.add('hidden');
        this.scrollIndicator.classList.add('hidden');
        
        // Show portfolio overlay immediately
        this.showPortfolio();
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
