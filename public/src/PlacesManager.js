import * as THREE from 'three';

/**
 * PlacesManager - Handles all travel location markers and information
 * Makes it easy to add, manage, and display places you've visited
 */
export class PlacesManager {
    constructor(mapTilerMap) {
        this.mapTilerMap = mapTilerMap;
        this.markers = new Map(); // Store all markers for easy cleanup
        this.places = this.initializePlaces();
        this.placesListElement = null; // Reference to the places list sidebar
        this.isListVisible = false;
        
        // Initialize the places list UI
        this.createPlacesList();
    }

    /**
     * Initialize all places data
     * Add new places here - each place should have coordinates, name, description, etc.
     */
    initializePlaces() {
        return [
            {
                id: 'erbil-citadel',
                name: 'Erbil Citadel',
                coordinates: [44.0092, 36.1911],
                description: 'One of the oldest continuously inhabited places in the world, dating back over 6,000 years.',
                visitDate: 'October 2023',
                type: 'historic_site',
                importance: 'high',
                photos: [
                    {
                        src: 'textures/photos/PXL_20241101_143435275.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20221016_100441108.jpg',
                        isPhotosphere: false,
                        caption: ''
                    }
                ],
                stories: [] // Add stories here later
            },
            {
                id: 'erbil-arab_quater',
                name: 'Erbil Arab Quater',
                coordinates: [44.0122778, 36.1893889],
                description: '',
                visitDate: 'October 2023',
                type: 'historic_site',
                importance: 'high',
                photos: [
                    {
                        src: 'textures/photos/PXL_20241102_103301112.PHOTOSPHERE.jpg',
                        isPhotosphere: true,
                        caption: '360° view of Erbil Arab Quater'
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103748514.PHOTOSPHERE.jpg',
                        isPhotosphere: true,
                        caption: '360° view of Erbil Arab Quater'
                    }
                ],
                stories: ["test story"] // Add stories here later
            }
        ];
    }

    /**
     * Add a marker for a specific place using MapTiler's native marker functionality
     */
    addPlaceMarker(placeId) {
        const place = this.places.find(p => p.id === placeId);
        if (!place) {
            console.error(`Place with id "${placeId}" not found`);
            return null;
        }

        if (this.markers.has(placeId)) {
            console.warn(`Marker for "${placeId}" already exists`);
            return this.markers.get(placeId);
        }

        console.log(`Adding marker for ${place.name}`);

        // Create MapTiler default marker (no custom element needed)
        const marker = new maplibregl.Marker()
            .setLngLat(place.coordinates)
            .addTo(this.mapTilerMap);

        // Create popup using MapTiler's native popup
        const popup = this.createNativePopup(place);
        
        // Use MapTiler's native event handling
        marker.getElement().addEventListener('click', () => {
            console.log('Marker clicked!', place.name);
            popup.setLngLat(place.coordinates).addTo(this.mapTilerMap);
            
            // Add click handlers for photos after popup is added
            setTimeout(() => {
                this.addPhotoClickHandlers(place);
            }, 100);
        });

        // Add cursor pointer effect to the marker
        marker.getElement().style.cursor = 'pointer';

        // Store marker reference
        this.markers.set(placeId, marker);
        
        console.log(`Marker for ${place.name} added successfully using native MapTiler functionality`);
        
        return marker;
    }


    /**
     * Create popup using MapTiler's native popup functionality
     */
    createNativePopup(place) {
        const popupContent = `
            <div class="place-popup">
                <h3 class="popup-title">${place.name}</h3>
                <p class="popup-description">${place.description}</p>
                <p class="popup-date">Visit Date: ${place.visitDate}</p>
                ${place.photos.length > 0 ? `
                    <div class="popup-photos">
                        ${place.photos.map(photo => {
                            const photoSrc = typeof photo === 'string' ? photo : photo.src;
                            const photoCaption = typeof photo === 'object' && photo.caption ? photo.caption : '';
                            const isPhotosphere = typeof photo === 'object' && photo.isPhotosphere;
                            const icon = isPhotosphere ? '🌐' : '📸';
                            return `
                                <div class="photo-container" data-photosphere="${isPhotosphere}">
                                    <img src="${photoSrc}" alt="${place.name} photo" class="popup-photo" />
                                    <div class="photo-overlay">
                                        <span class="photo-icon">${icon}</span>
                                        ${photoCaption ? `<span class="photo-caption">${photoCaption}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        <small class="photo-count">${place.photos.length} photo${place.photos.length > 1 ? 's' : ''}</small>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Create native MapTiler popup with proper styling
        const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            className: 'custom-popup',
            maxWidth: '280px'
        }).setHTML(popupContent);
        
        // Add custom CSS for the popup
        this.addPopupStyles();
        
        return popup;
    }

    /**
     * Add click handlers for photos in the popup
     */
    addPhotoClickHandlers(place) {
        const photoContainers = document.querySelectorAll('.photo-container');
        photoContainers.forEach((container, index) => {
            container.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent popup from closing
                const photo = place.photos[index];
                const photoSrc = typeof photo === 'string' ? photo : photo.src;
                const isPhotosphere = typeof photo === 'object' && photo.isPhotosphere;
                this.showPhotoModal(photoSrc, place.name, isPhotosphere);
            });
        });
    }

    /**
     * Show a modal with the full-size photo or photosphere viewer
     */
    showPhotoModal(photoSrc, placeName, isPhotosphere = false) {
        if (isPhotosphere) {
            this.showPhotosphereModal(photoSrc, placeName);
        } else {
            this.showRegularPhotoModal(photoSrc, placeName);
        }
    }

    /**
     * Show a regular photo modal
     */
    showRegularPhotoModal(photoSrc, placeName) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'photo-modal-overlay';
        modal.innerHTML = `
            <div class="photo-modal">
                <div class="photo-modal-header">
                    <h3>${placeName}</h3>
                    <button class="photo-modal-close">&times;</button>
                </div>
                <div class="photo-modal-content">
                    <img src="${photoSrc}" alt="${placeName} photo" class="photo-modal-image" />
                </div>
            </div>
        `;
        
        // Add modal styles if not already added
        this.addPhotoModalStyles();
        
        // Add to page
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.photo-modal-close');
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Show a photosphere viewer modal
     */
    showPhotosphereModal(photoSrc, placeName) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'photosphere-modal-overlay';
        modal.innerHTML = `
            <div class="photosphere-modal">
                <div class="photosphere-modal-header">
                    <h3>${placeName} - 360° View</h3>
                    <div class="photosphere-controls">
                        <button class="photosphere-fullscreen" title="Fullscreen">⛶</button>
                        <button class="photosphere-close">&times;</button>
                    </div>
                </div>
                <div class="photosphere-container">
                    <div id="photosphere-canvas"></div>
                    <div class="photosphere-loading">Loading 360° view...</div>
                    <div class="photosphere-instructions">
                        <p>🖱️ Drag to look around • 🔍 Scroll to zoom • Use controls for more options</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not already added
        this.addPhotosphereModalStyles();
        
        // Add to page
        document.body.appendChild(modal);
        console.log('Photosphere modal added to DOM:', modal);
        
        // Initialize the photosphere viewer
        this.initPhotosphereViewer(photoSrc, placeName).catch(error => {
            console.error('Error initializing photosphere viewer:', error);
            const loading = container.parentElement.querySelector('.photosphere-loading');
            if (loading) {
                loading.textContent = 'Error loading 360° viewer';
                loading.style.color = '#ff4444';
            }
        });
        
        // Define closeModal function for use in all event listeners
        const closeModal = () => {
            console.log('Closing photosphere modal');
            // Clean up the photosphere viewer
            if (this.photosphereViewer) {
                try {
                    // Use the correct Photo Sphere Viewer cleanup method
                    if (typeof this.photosphereViewer.destroy === 'function') {
                        this.photosphereViewer.destroy();
                        console.log('Photosphere viewer destroyed');
                    } else {
                        console.log('Destroy method not found, trying manual cleanup');
                        // Try to clear the container manually
                        const container = document.getElementById('photosphere-canvas');
                        if (container) {
                            container.innerHTML = '';
                        }
                    }
                } catch (error) {
                    console.warn('Error during photosphere cleanup:', error);
                }
                this.photosphereViewer = null;
            }
            modal.remove();
        };
        
        // Add event listeners with multiple attempts to ensure they work
        const addButtonListeners = () => {
            const closeBtn = modal.querySelector('.photosphere-close');
            const resetBtn = modal.querySelector('.photosphere-reset');
            const fullscreenBtn = modal.querySelector('.photosphere-fullscreen');
            
            console.log('Photosphere buttons found:', { closeBtn, resetBtn, fullscreenBtn });
            
            if (closeBtn) {
                // Remove any existing listeners to prevent duplicates
                closeBtn.replaceWith(closeBtn.cloneNode(true));
                const newCloseBtn = modal.querySelector('.photosphere-close');
                
                newCloseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close button clicked');
                    closeModal();
                });
                console.log('Close button event listener added');
            } else {
                console.error('Close button not found!');
            }
            
            if (resetBtn) {
                // Remove any existing listeners to prevent duplicates
                resetBtn.replaceWith(resetBtn.cloneNode(true));
                const newResetBtn = modal.querySelector('.photosphere-reset');
                
                newResetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Reset button clicked');
                    if (this.photosphereViewer) {
                        this.photosphereViewer.animate({
                            longitude: 0,
                            latitude: 0,
                            zoom: 0
                        });
                    }
                });
                console.log('Reset button event listener added');
            } else {
                console.error('Reset button not found!');
            }
            
            if (fullscreenBtn) {
                // Remove any existing listeners to prevent duplicates
                fullscreenBtn.replaceWith(fullscreenBtn.cloneNode(true));
                const newFullscreenBtn = modal.querySelector('.photosphere-fullscreen');
                
                newFullscreenBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Fullscreen button clicked');
                    if (this.photosphereViewer) {
                        this.photosphereViewer.toggleFullscreen();
                    }
                });
                console.log('Fullscreen button event listener added');
            } else {
                console.error('Fullscreen button not found!');
            }
        };
        
        // Try immediately and with delays to ensure buttons work
        addButtonListeners();
        setTimeout(addButtonListeners, 100);
        setTimeout(addButtonListeners, 500);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Add styles for the photo modal
     */
    addPhotoModalStyles() {
        if (document.querySelector('.photo-modal-styles')) return;
        
        const style = document.createElement('style');
        style.className = 'photo-modal-styles';
        style.textContent = `
            .photo-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .photo-modal {
                background: white;
                border-radius: 12px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .photo-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .photo-modal-header h3 {
                margin: 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            }
            
            .photo-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s ease;
            }
            
            .photo-modal-close:hover {
                background-color: #e9ecef;
                color: #333;
            }
            
            .photo-modal-content {
                padding: 0;
                max-height: calc(90vh - 80px);
                overflow: auto;
            }
            
            .photo-modal-image {
                width: 100%;
                height: auto;
                max-height: calc(90vh - 80px);
                object-fit: contain;
                display: block;
            }
            
            @media (max-width: 768px) {
                .photo-modal {
                    max-width: 95vw;
                    max-height: 95vh;
                }
                
                .photo-modal-header {
                    padding: 12px 16px;
                }
                
                .photo-modal-header h3 {
                    font-size: 16px;
                }
                
                .photo-modal-content {
                    max-height: calc(95vh - 60px);
                }
                
                .photo-modal-image {
                    max-height: calc(95vh - 60px);
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add styles for the photosphere modal
     */
    addPhotosphereModalStyles() {
        if (document.querySelector('.photosphere-modal-styles')) return;
        
        const style = document.createElement('style');
        style.className = 'photosphere-modal-styles';
        style.textContent = `
            .photosphere-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .photosphere-modal {
                background: #1a1a1a;
                border-radius: 12px;
                width: 90vw;
                height: 90vh;
                max-width: 1200px;
                max-height: 800px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
            }
            
            .photosphere-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: #2a2a2a;
                border-bottom: 1px solid #444;
                color: white;
            }
            
            .photosphere-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: white;
            }
            
            .photosphere-controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            
            .photosphere-reset,
            .photosphere-fullscreen,
            .photosphere-close {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 36px;
                height: 36px;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                pointer-events: auto;
                z-index: 10001;
                position: relative;
            }
            
            .photosphere-reset:hover,
            .photosphere-fullscreen:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .photosphere-close {
                background: rgba(255, 68, 68, 0.2);
                border-color: rgba(255, 68, 68, 0.3);
                font-size: 18px;
                font-weight: bold;
            }
            
            .photosphere-close:hover {
                background: rgba(255, 68, 68, 0.3);
                border-color: rgba(255, 68, 68, 0.5);
            }
            
            .photosphere-container {
                flex: 1;
                position: relative;
                background: #000;
                overflow: hidden;
            }
            
            #photosphere-canvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            /* Photo Sphere Viewer specific styles */
            #photosphere-canvas .psv-container {
                width: 100% !important;
                height: 100% !important;
            }
            
            #photosphere-canvas .psv-canvas-container {
                width: 100% !important;
                height: 100% !important;
            }
            
            .photosphere-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 16px;
                text-align: center;
                z-index: 10;
                background: rgba(0, 0, 0, 0.7);
                padding: 20px 30px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
            }
            
            .photosphere-instructions {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 20px;
                font-size: 14px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 10;
            }
            
            .photosphere-instructions p {
                margin: 0;
                opacity: 0.9;
            }
            
            /* Fullscreen styles */
            .photosphere-modal.fullscreen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                max-width: none;
                max-height: none;
                border-radius: 0;
                z-index: 10001;
            }
            
            .photosphere-modal.fullscreen .photosphere-instructions {
                bottom: 30px;
            }
            
            @media (max-width: 768px) {
                .photosphere-modal {
                    width: 95vw;
                    height: 95vh;
                }
                
                .photosphere-modal-header {
                    padding: 12px 16px;
                }
                
                .photosphere-modal-header h3 {
                    font-size: 16px;
                }
                
                .photosphere-controls {
                    gap: 6px;
                }
                
                .photosphere-reset,
                .photosphere-fullscreen,
                .photosphere-close {
                    padding: 6px 10px;
                    min-width: 32px;
                    height: 32px;
                    font-size: 12px;
                }
                
                .photosphere-instructions {
                    bottom: 15px;
                    padding: 10px 16px;
                    font-size: 12px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Initialize the photosphere viewer using Photo Sphere Viewer library
     */
    async initPhotosphereViewer(photoSrc, placeName) {
        const container = document.getElementById('photosphere-canvas');
        
        if (!container) {
            console.error('Photosphere canvas container not found!');
            return;
        }
        
        console.log('Initializing photosphere viewer with:', { photoSrc, placeName, container });
        
        try {
            // Import Viewer dynamically to avoid bundle size issues
            const { Viewer } = await import('@photo-sphere-viewer/core');
            this.photosphereViewer = new Viewer({
            container: container,
            panorama: photoSrc,
            caption: placeName,
            loadingImg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2Utb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMjAgMjAiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBzdHJva2Utb3BhY2l0eT0iMC44Ij4KICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHZhbHVlcz0iMCAyMCIvPgo8L2NpcmNsZT4KPC9zdmc+',
            navbar: [
                'autorotate',
                'zoom',
                'fullscreen',
                'caption'
            ],
            plugins: [
                // Add any plugins you want here
            ],
            defaultZoomLvl: 0,
            minFov: 30,
            maxFov: 90,
            autorotateLat: 0,
            autorotateDelay: 1000,
            autorotateSpeed: '0.5rpm'
        });
        
        console.log('Photosphere viewer created:', this.photosphereViewer);
        
        // Hide loading indicator when loaded
        this.photosphereViewer.addEventListener('ready', () => {
            console.log('Photosphere viewer ready');
            const loading = container.parentElement.querySelector('.photosphere-loading');
            if (loading) loading.style.display = 'none';
        });
        
        // Handle errors
        this.photosphereViewer.addEventListener('panorama-error', (e) => {
            console.error('Failed to load photosphere:', e);
            const loading = container.parentElement.querySelector('.photosphere-loading');
            if (loading) {
                loading.textContent = 'Failed to load 360° view';
                loading.style.color = '#ff4444';
            }
        });
        
        } catch (error) {
            console.error('Error initializing photosphere viewer:', error);
            const loading = container.parentElement.querySelector('.photosphere-loading');
            if (loading) {
                loading.textContent = 'Error loading 360° viewer';
                loading.style.color = '#ff4444';
            }
        }
    }

    /**
     * Add custom styles for the popup
     */
    addPopupStyles() {
        if (document.querySelector('.popup-styles')) return;
        
        const style = document.createElement('style');
        style.className = 'popup-styles';
        style.textContent = `
            .custom-popup .maplibregl-popup-content {
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            
            .place-popup {
                padding: 16px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .popup-title {
                margin: 0 0 8px 0;
                color: #333;
                font-size: 16px;
                font-weight: 600;
            }
            
            .popup-description {
                margin: 0 0 8px 0;
                color: #666;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .popup-date {
                margin: 0 0 8px 0;
                color: #888;
                font-size: 12px;
                font-weight: 500;
            }
            
            .popup-photos {
                margin-top: 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .photo-container {
                position: relative;
                width: 100%;
                max-width: 200px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .photo-container:hover {
                transform: scale(1.02);
            }
            
            .popup-photo {
                width: 100%;
                height: auto;
                max-height: 120px;
                object-fit: cover;
                display: block;
            }
            
            .photo-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .photo-container:hover .photo-overlay {
                opacity: 1;
            }
            
            .photo-icon {
                color: white;
                font-size: 24px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
            }
            
            .photo-caption {
                color: white;
                font-size: 12px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                margin-top: 4px;
                display: block;
            }
            
            .photo-count {
                color: #888;
                font-size: 12px;
                text-align: center;
                margin-top: 4px;
            }
            
            .custom-popup .maplibregl-popup-close-button {
                color: #666;
                font-size: 18px;
                padding: 4px;
            }
            
            .custom-popup .maplibregl-popup-close-button:hover {
                color: #333;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Add styles for the places list
     */
    addPlacesListStyles() {
        if (document.querySelector('.places-list-styles')) return;
        
        const style = document.createElement('style');
        style.className = 'places-list-styles';
        style.textContent = `
            .places-list-container {
                position: fixed;
                top: 0;
                left: 0;
                height: 100vh;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: white;
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
            }
            
            .places-list-container.collapsed {
                width: 60px;
            }
            
            .places-list-container:not(.collapsed) {
                width: 320px;
            }
            
            .places-list-header {
                background: #f8f9fa;
                color: #333;
                padding: 16px 20px;
                font-size: 16px;
                font-weight: 500;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                user-select: none;
                min-height: 56px;
                box-sizing: border-box;
            }
            
            .places-list-container.collapsed .places-list-header {
                padding: 16px 12px;
                justify-content: center;
            }
            
            .places-list-title {
                flex: 1;
                font-weight: 500;
                color: #1a73e8;
            }
            
            .places-list-container.collapsed .places-list-title {
                display: none;
            }
            
            .places-list-toggle {
                background: none;
                border: none;
                color: #5f6368;
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
            }
            
            .places-list-toggle:hover {
                background: rgba(95, 99, 104, 0.1);
                color: #1a73e8;
            }
            
            .toggle-icon {
                transition: transform 0.2s ease;
                font-size: 16px;
            }
            
            .hamburger-icon {
                font-size: 18px;
                font-weight: bold;
            }
            
            .places-list {
                flex: 1;
                overflow-y: auto;
                background: white;
            }
            
            .place-item {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .place-item:last-child {
                border-bottom: none;
            }
            
            .place-item:hover {
                background: #f8f9fa;
            }
            
            .place-item:active {
                background: #e8f0fe;
            }
            
            .places-list-container.collapsed .place-item {
                padding: 16px 12px;
                justify-content: center;
            }
            
            .place-item-content {
                flex: 1;
            }
            
            .places-list-container.collapsed .place-item-content {
                display: none;
            }
            
            .place-name {
                font-size: 14px;
                font-weight: 500;
                color: #202124;
                margin-bottom: 4px;
                line-height: 1.4;
            }
            
            .place-date {
                font-size: 12px;
                color: #5f6368;
                margin-bottom: 2px;
            }
            
            .place-type {
                font-size: 12px;
                color: #1a73e8;
                font-weight: 400;
            }
            
            .place-fly-button {
                font-size: 18px;
                color: #5f6368;
                transition: all 0.2s ease;
                padding: 8px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
            }
            
            .place-item:hover .place-fly-button {
                color: #1a73e8;
                background: rgba(26, 115, 232, 0.1);
            }
            
            .places-list-container.collapsed .place-fly-button {
                font-size: 16px;
                width: 36px;
                height: 36px;
            }
            
            /* Scrollbar styling */
            .places-list::-webkit-scrollbar {
                width: 8px;
            }
            
            .places-list::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .places-list::-webkit-scrollbar-thumb {
                background: rgba(95, 99, 104, 0.3);
                border-radius: 4px;
            }
            
            .places-list::-webkit-scrollbar-thumb:hover {
                background: rgba(95, 99, 104, 0.5);
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .places-list-container:not(.collapsed) {
                    width: 280px;
                }
                
                .places-list-container.collapsed {
                    width: 56px;
                }
                
                .places-list-header {
                    padding: 12px 16px;
                    font-size: 14px;
                    min-height: 48px;
                }
                
                .places-list-container.collapsed .places-list-header {
                    padding: 12px 8px;
                }
                
                .places-list-toggle {
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
                
                .place-item {
                    padding: 12px 16px;
                }
                
                .places-list-container.collapsed .place-item {
                    padding: 12px 8px;
                }
                
                .place-name {
                    font-size: 13px;
                }
                
                .place-date {
                    font-size: 11px;
                }
                
                .place-type {
                    font-size: 11px;
                }
                
                .place-fly-button {
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
                
                .places-list-container.collapsed .place-fly-button {
                    width: 32px;
                    height: 32px;
                    font-size: 14px;
                }
            }
            
            /* Extra small mobile devices */
            @media (max-width: 480px) {
                .places-list-container:not(.collapsed) {
                    width: 260px;
                }
                
                .places-list-container.collapsed {
                    width: 52px;
                }
                
                .places-list-header {
                    padding: 10px 14px;
                    font-size: 13px;
                    min-height: 44px;
                }
                
                .places-list-container.collapsed .places-list-header {
                    padding: 10px 6px;
                }
                
                .place-item {
                    padding: 10px 14px;
                }
                
                .places-list-container.collapsed .place-item {
                    padding: 10px 6px;
                }
                
                .place-name {
                    font-size: 12px;
                }
                
                .place-date {
                    font-size: 10px;
                }
                
                .place-type {
                    font-size: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Create the places list sidebar
     */
    createPlacesList() {
        // Create the main container
        this.placesListElement = document.createElement('div');
        this.placesListElement.className = 'places-list-container';
        
        // Create header with toggle button
        const header = document.createElement('div');
        header.className = 'places-list-header';
        header.innerHTML = `
            <span class="places-list-title">My Places</span>
            <button class="places-list-toggle" title="Toggle places list">
                <span class="toggle-icon">▼</span>
                <span class="hamburger-icon" style="display: none;">☰</span>
            </button>
        `;
        
        // Create the list container
        const listContainer = document.createElement('div');
        listContainer.className = 'places-list';
        listContainer.style.display = 'block'; // Show all places from the beginning
        
        // Add places to the list
        this.places.forEach(place => {
            const placeItem = this.createPlaceListItem(place);
            listContainer.appendChild(placeItem);
        });
        
        // Assemble the component
        this.placesListElement.appendChild(header);
        this.placesListElement.appendChild(listContainer);
        
        // Initially hidden - will be shown when MapTiler view is active
        this.placesListElement.style.display = 'none';
        
        // Add toggle functionality
        this.setupToggleFunctionality();
        
        // Add to the page
        document.body.appendChild(this.placesListElement);
        
        // Add styles
        this.addPlacesListStyles();
        
        console.log('Places list created and added to page');
    }

    /**
     * Setup toggle functionality for the places list
     */
    setupToggleFunctionality() {
        const toggleButton = this.placesListElement.querySelector('.places-list-toggle');
        const listContainer = this.placesListElement.querySelector('.places-list');
        const toggleIcon = this.placesListElement.querySelector('.toggle-icon');
        const hamburgerIcon = this.placesListElement.querySelector('.hamburger-icon');
        
        // Check if we're on mobile and start collapsed
        const isMobile = window.innerWidth <= 768;
        this.isListCollapsed = isMobile; // Start collapsed on mobile
        
        if (toggleButton && listContainer && toggleIcon && hamburgerIcon) {
            // Set initial state
            if (this.isListCollapsed) {
                listContainer.style.display = 'none';
                toggleIcon.style.display = 'none';
                hamburgerIcon.style.display = 'block';
                this.placesListElement.classList.add('collapsed');
            }
            
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePlacesList();
            });
        }
    }

    /**
     * Toggle the places list visibility
     */
    togglePlacesList() {
        const listContainer = this.placesListElement.querySelector('.places-list');
        const toggleIcon = this.placesListElement.querySelector('.toggle-icon');
        const hamburgerIcon = this.placesListElement.querySelector('.hamburger-icon');
        
        if (listContainer && toggleIcon && hamburgerIcon) {
            this.isListCollapsed = !this.isListCollapsed;
            
            if (this.isListCollapsed) {
                listContainer.style.display = 'none';
                toggleIcon.style.display = 'none';
                hamburgerIcon.style.display = 'block';
                this.placesListElement.classList.add('collapsed');
            } else {
                listContainer.style.display = 'block';
                toggleIcon.style.display = 'block';
                hamburgerIcon.style.display = 'none';
                this.placesListElement.classList.remove('collapsed');
            }
        }
    }

    /**
     * Create a single place item for the list
     */
    createPlaceListItem(place) {
        const placeItem = document.createElement('div');
        placeItem.className = `place-item ${place.id}`;
        placeItem.innerHTML = `
            <div class="place-item-content">
                <div class="place-name">${place.name}</div>
                <div class="place-date">${place.visitDate}</div>
                <div class="place-type">${this.formatPlaceType(place.type)}</div>
            </div>
            <div class="place-fly-button">✈️</div>
        `;
        
        // Add click handler to fly to this place
        placeItem.addEventListener('click', () => {
            this.flyToPlace(place);
        });
        
        return placeItem;
    }

    /**
     * Format place type for display
     */
    formatPlaceType(type) {
        const typeMap = {
            'historic_site': '🏛️ Historic Site',
            'vacation': '🏖️ Vacation',
            'work': '💼 Work',
            'nature': '🌲 Nature'
        };
        return typeMap[type] || '📍 Place';
    }


    /**
     * Fly to a specific place using MapTiler's native flyTo
     */
    flyToPlace(place) {
        console.log(`Flying to ${place.name} at coordinates:`, place.coordinates);
        
        // Use MapTiler's native flyTo method
        this.mapTilerMap.flyTo({
            center: place.coordinates,
            zoom: 13, // Good zoom level for city/landmark viewing
            duration: 2000, // 2 second smooth animation
            essential: true // Animation cannot be interrupted
        });
        
        // Add marker if it doesn't exist
        if (!this.markers.has(place.id)) {
            this.addPlaceMarker(place.id);
        }
        
        // Keep the places list open after flying
    }

    /**
     * Add all places as markers
     */
    addAllMarkers() {
        this.places.forEach(place => {
            this.addPlaceMarker(place.id);
        });
    }

    /**
     * Remove a specific marker
     */
    removeMarker(placeId) {
        const marker = this.markers.get(placeId);
        if (marker) {
            marker.remove();
            this.markers.delete(placeId);
            console.log(`Marker for ${placeId} removed`);
        }
    }

    /**
     * Remove all markers
     */
    removeAllMarkers() {
        this.markers.forEach((marker, placeId) => {
            marker.remove();
        });
        this.markers.clear();
        console.log('All place markers removed');
    }

    /**
     * Remove the places list from the page
     */
    removePlacesList() {
        if (this.placesListElement) {
            this.placesListElement.remove();
            this.placesListElement = null;
            console.log('Places list removed from page');
        }
    }

    /**
     * Show/hide the places list
     */
    setPlacesListVisibility(visible) {
        if (this.placesListElement) {
            this.placesListElement.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Get all places data
     */
    getAllPlaces() {
        return this.places;
    }

    /**
     * Add a new place (for future expansion)
     */
    addPlace(placeData) {
        this.places.push(placeData);
        console.log(`New place added: ${placeData.name}`);
    }

    /**
     * Get places by type
     */
    getPlacesByType(type) {
        return this.places.filter(place => place.type === type);
    }

    /**
     * Get places by importance
     */
    getPlacesByImportance(importance) {
        return this.places.filter(place => place.importance === importance);
    }
}

