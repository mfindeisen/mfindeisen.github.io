import maplibregl from 'maplibre-gl';

export const MAP_START_ZOOM = 4.21;

/**
 * Scroll progress at which the map starts fading in over the 3D scene.
 */
export function mapHandoffProgress(): number {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
    return isMobile ? 0.90 : 0.968;
}

/**
 * MapManager - Handles MapTiler map initialization and management
 */
export class MapManager {
    mapTilerMap: any;
    isInitialized: boolean;
    originalCenter: [number, number];
    originalZoom: number;
    isPrefetching: boolean;

    constructor() {
        this.mapTilerMap = null;
        this.isInitialized = false;
        this.originalCenter = [0, 0];
        this.originalZoom = MAP_START_ZOOM;
        this.isPrefetching = false;
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
                // The unfolded globe is an equirectangular projection centred on 0°/0°
                const earthCenter: [number, number] = [0, 0];
                this.originalCenter = earthCenter;

                // Initialize MapTiler map
                this.mapTilerMap = new maplibregl.Map({
                    container: containerId,
                    style: `${styleUrl}?key=${apiKey}`,
                    center: earthCenter,
                    zoom: this.originalZoom,
                    // The footer is hidden on the map, so the legal pages stay reachable here
                    attributionControl: {
                        customAttribution: '<a href="/impressum.html">Impressum</a> | <a href="/datenschutz.html">Datenschutz</a>'
                    },
                    interactive: false // Start with interactions disabled
                });

                this.mapTilerMap.on('load', () => {
                    console.log('MapTiler map loaded with center:', earthCenter);
                    // The semi-transparent white road overlay washes out dense city imagery
                    if (this.mapTilerMap.getLayer('Road')) {
                        this.mapTilerMap.setLayoutProperty('Road', 'visibility', 'none');
                    }
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
     * Load the tiles around a destination while the map is still invisible, so a later flyTo
     * does not have to wait for them. Zoom levels should be ascending so the final view stays
     * the most recently used in the tile cache.
     */
    async prefetchArea(center: [number, number], zooms: number[], stepTimeout = 5000) {
        if (!this.mapTilerMap || this.isPrefetching) return;

        this.isPrefetching = true;
        for (const zoom of zooms) {
            if (!this.isPrefetching) return;
            this.mapTilerMap.jumpTo({ center, zoom });
            await this.waitForIdle(stepTimeout);
        }

        if (this.isPrefetching) {
            this.isPrefetching = false;
            this.mapTilerMap.jumpTo({ center: this.originalCenter, zoom: this.originalZoom });
        }
    }

    /**
     * Stop a running prefetch and put the camera back to the start position right away
     */
    cancelPrefetch() {
        if (!this.isPrefetching) return;
        this.isPrefetching = false;
        this.mapTilerMap.jumpTo({ center: this.originalCenter, zoom: this.originalZoom });
    }

    waitForIdle(timeout: number) {
        return new Promise<void>((resolve) => {
            const done = () => {
                clearTimeout(timer);
                this.mapTilerMap.off('idle', done);
                resolve();
            };
            const timer = setTimeout(done, timeout);
            this.mapTilerMap.once('idle', done);
        });
    }

    /**
     * Fly to specific coordinates with animation
     */
    flyTo(center: any, zoom: any, duration = 8000) {
        if (!this.mapTilerMap) {
            console.warn('MapTiler map not initialized');
            return Promise.reject('Map not initialized');
        }

        this.cancelPrefetch();

        return new Promise<void>((resolve) => {
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

        this.cancelPrefetch();

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
