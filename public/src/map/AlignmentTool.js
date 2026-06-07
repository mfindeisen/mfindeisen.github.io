/**
 * AlignmentTool - Handles map alignment and positioning tools
 */
export class AlignmentTool {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.toolElement = null;
        this.isVisible = false;
        this.settings = {
            lng: 0,
            lat: 0,
            zoom: 4.11
        };
    }

    /**
     * Create and setup the alignment tool
     */
    create() {
        if (this.toolElement) {
            console.warn('Alignment tool already created');
            return;
        }

        this.toolElement = document.createElement('div');
        this.toolElement.id = 'alignment-tool';
        this.toolElement.innerHTML = `
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
        
        document.body.appendChild(this.toolElement);
        this.setupEventListeners();
        this.loadSavedSettings();
        
        console.log('Alignment tool created. Press M to toggle.');
    }

    /**
     * Setup event listeners for the alignment tool
     */
    setupEventListeners() {
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
            if (!this.mapManager.isMapInitialized()) return;
            
            const lng = parseFloat(lngSlider.value);
            const lat = parseFloat(latSlider.value);
            const zoom = parseFloat(zoomSlider.value);
            
            // Update display values
            lngValue.textContent = `${lng.toFixed(2)}°`;
            latValue.textContent = `${lat.toFixed(2)}°`;
            zoomValue.textContent = zoom.toFixed(2);
            
            // Update map center and zoom
            this.mapManager.updateCenter(lng, lat);
            this.mapManager.setZoom(zoom);
            
            // Update settings
            this.settings = { lng, lat, zoom };
            
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
                
                // Save to localStorage for persistence
                this.saveSettings({
                    lng: parseFloat(lngSlider.value),
                    lat: parseFloat(latSlider.value),
                    zoom: parseFloat(zoomSlider.value)
                });
            });
        });
        
        // Hide tool
        hideBtn.addEventListener('click', () => {
            this.hide();
        });
        
        // Add keyboard shortcut to toggle tool
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyM' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                this.toggle();
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Show the alignment tool
     */
    show() {
        if (this.toolElement) {
            this.toolElement.style.display = 'block';
            this.isVisible = true;
        }
    }

    /**
     * Hide the alignment tool
     */
    hide() {
        if (this.toolElement) {
            this.toolElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Toggle the alignment tool visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Save alignment settings to localStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem('earthMapAlignment', JSON.stringify(settings));
            console.log('Alignment settings saved:', settings);
        } catch (e) {
            console.warn('Could not save alignment settings:', e);
        }
    }

    /**
     * Load alignment settings from localStorage
     */
    loadSavedSettings() {
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
                    
                    // Update map with saved settings if map is initialized
                    if (this.mapManager.isMapInitialized()) {
                        this.mapManager.updateCenter(settings.lng || 0, settings.lat || 0);
                        this.mapManager.setZoom(settings.zoom || 4.11);
                    }
                    
                    // Update settings object
                    this.settings = {
                        lng: settings.lng || 0,
                        lat: settings.lat || 0,
                        zoom: settings.zoom || 4.11
                    };
                }
                
                return settings;
            }
        } catch (e) {
            console.warn('Could not load alignment settings:', e);
        }
        return null;
    }

    /**
     * Get current alignment settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Apply alignment settings to the map
     */
    applySettings(settings) {
        if (!this.mapManager.isMapInitialized()) {
            console.warn('Map not initialized, cannot apply settings');
            return;
        }

        this.mapManager.updateCenter(settings.lng, settings.lat);
        this.mapManager.setZoom(settings.zoom);
        
        // Update sliders if tool is visible
        if (this.isVisible) {
            const lngSlider = document.getElementById('lng-slider');
            const latSlider = document.getElementById('lat-slider');
            const zoomSlider = document.getElementById('zoom-slider');
            
            if (lngSlider && latSlider && zoomSlider) {
                lngSlider.value = settings.lng;
                latSlider.value = settings.lat;
                zoomSlider.value = settings.zoom;
            }
        }
        
        this.settings = { ...settings };
    }

    /**
     * Destroy the alignment tool
     */
    destroy() {
        if (this.toolElement) {
            this.toolElement.remove();
            this.toolElement = null;
        }
        this.isVisible = false;
    }
}
