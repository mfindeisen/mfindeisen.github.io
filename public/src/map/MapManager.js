/**
 * MapManager - Handles MapTiler map initialization and management
 */
export class MapManager {
    constructor() {
        this.mapTilerMap = null;
        this.isInitialized = false;
        this.originalCenter = [0, 0];
        this.originalZoom = 4.11;
    }

    /**
     * Initialize MapTiler map
     */
    init(containerId, styleUrl, apiKey) {
        if (this.isInitialized) {
            console.warn('MapManager already initialized');
            return Promise.resolve(this.mapTilerMap);
        }

        return new Promise((resolve, reject) => {
            try {
                // Calculate the center point of the 3D Earth model
                const earthCenter = this.calculateEarthCenter();
                this.originalCenter = earthCenter;
                
                // Initialize MapTiler map
                this.mapTilerMap = new maplibregl.Map({
                    container: containerId,
                    style: `${styleUrl}?key=${apiKey}`,
                    center: earthCenter,
                    zoom: this.originalZoom,
                    interactive: false // Start with interactions disabled
                });

                this.mapTilerMap.on('load', () => {
                    console.log('MapTiler map loaded with center:', earthCenter);
                    this.isInitialized = true;
                    resolve(this.mapTilerMap);
                });

                this.mapTilerMap.on('error', (error) => {
                    console.error('MapTiler map load error:', error);
                    reject(error);
                });

            } catch (error) {
                console.error('Error initializing MapTiler map:', error);
                reject(error);
            }
        });
    }

    /**
     * Calculate the center point of the 3D Earth model for perfect alignment
     */
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
        
        // Default center (can be adjusted for better alignment)
        return [0, 0]; // [longitude, latitude]
    }

    /**
     * Update map center with custom coordinates
     */
    updateCenter(lng, lat) {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return;
        }
        
        this.mapTilerMap.setCenter([lng, lat]);
        console.log(`Map center updated to: [${lng}, ${lat}]`);
    }

    /**
     * Get current map center
     */
    getCenter() {
        if (!this.mapTilerMap) {
            return this.originalCenter;
        }
        return this.mapTilerMap.getCenter().toArray();
    }

    /**
     * Set map zoom level
     */
    setZoom(zoom) {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return;
        }
        
        this.mapTilerMap.setZoom(zoom);
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        if (!this.mapTilerMap) {
            return this.originalZoom;
        }
        return this.mapTilerMap.getZoom();
    }

    /**
     * Enable or disable map interactions
     */
    setInteractions(enabled) {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return;
        }
        
        if (enabled) {
            this.mapTilerMap.dragPan.enable();
            this.mapTilerMap.scrollZoom.enable();
            this.mapTilerMap.doubleClickZoom.enable();
            this.mapTilerMap.touchZoomRotate.enable();
            console.log('Map interactions enabled');
        } else {
            this.mapTilerMap.dragPan.disable();
            this.mapTilerMap.scrollZoom.disable();
            this.mapTilerMap.doubleClickZoom.disable();
            this.mapTilerMap.touchZoomRotate.disable();
            console.log('Map interactions disabled');
        }
    }

    /**
     * Fly to specific coordinates with animation
     */
    flyTo(center, zoom, duration = 8000) {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return Promise.reject('Map not initialized');
        }

        return new Promise((resolve) => {
            // Listen for the moveend event which triggers when flyTo finishes
            this.mapTilerMap.once('moveend', () => {
                resolve();
            });

            this.mapTilerMap.flyTo({
                center: center,
                zoom: zoom,
                duration: duration,
                essential: true
            });
        });
    }

    /**
     * Reset map to original state
     */
    reset() {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return;
        }
        
        console.log('Resetting map to original state');
        
        // Reset map to original position and zoom
        this.mapTilerMap.setCenter(this.originalCenter);
        this.mapTilerMap.setZoom(this.originalZoom);
        
        // Disable map interactions to match original state
        this.setInteractions(false);
        
        // Reset any ongoing animations
        if (this.mapTilerMap.isMoving()) {
            this.mapTilerMap.stop();
        }
        
        console.log('Map reset to center:', this.originalCenter, 'zoom:', this.originalZoom);
    }

    /**
     * Check if map is currently moving
     */
    isMoving() {
        if (!this.mapTilerMap) {
            return false;
        }
        return this.mapTilerMap.isMoving();
    }

    /**
     * Get map canvas element
     */
    getCanvas() {
        if (!this.mapTilerMap) {
            return null;
        }
        return this.mapTilerMap.getCanvas();
    }

    /**
     * Ensure map container allows interactions
     */
    ensureContainerInteractions(containerElement) {
        if (containerElement) {
            containerElement.style.pointerEvents = 'auto';
            console.log('Map container pointer events set to auto');
        }
        
        const mapCanvas = this.getCanvas();
        if (mapCanvas) {
            mapCanvas.style.pointerEvents = 'auto';
            console.log('Map canvas pointer events set to auto');
        }
    }

    /**
     * Get map instance
     */
    getMap() {
        return this.mapTilerMap;
    }

    /**
     * Check if map is initialized
     */
    isMapInitialized() {
        return this.isInitialized && this.mapTilerMap !== null;
    }

    /**
     * Destroy map instance
     */
    destroy() {
        if (this.mapTilerMap) {
            this.mapTilerMap.remove();
            this.mapTilerMap = null;
            this.isInitialized = false;
            console.log('MapManager destroyed');
        }
    }
}
