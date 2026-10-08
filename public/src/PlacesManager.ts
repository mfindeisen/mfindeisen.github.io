import maplibregl from 'maplibre-gl';
import { getIcon } from './utils/Icons.js';
import { Modal } from './ui/Modal.js';
import { places } from './data/places.js';

/**
 * PlacesManager - Handles all travel location markers and information
 * Makes it easy to add, manage, and display places you've visited
 */
export class PlacesManager {
    mapTilerMap: any;
    markers: Map<string, any>;
    places: any[];
    placesListElement: HTMLDivElement | null;
    isListVisible: boolean;
    activePopup: any;
    modal: Modal;
    isMobile: boolean;
    isListCollapsed: boolean;
    backdropElement: HTMLDivElement | null;
    originalMapCursor: string;
    isInitialized: boolean;
    listVisibilityTimer: ReturnType<typeof setTimeout> | undefined;
    popupTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(mapTilerMap: any) {
        this.mapTilerMap = mapTilerMap;
        this.markers = new Map(); // Store all markers for easy cleanup
        this.places = this.initializePlaces();
        this.placesListElement = null; // Reference to the places list sidebar
        this.isListVisible = false;
        this.activePopup = null; // Track the currently open popup
        this.modal = new Modal(); // Centralized modal manager
        
        this.isMobile = false;
        this.isListCollapsed = false;
        this.backdropElement = null;
        this.originalMapCursor = '';
        this.isInitialized = false;

        // Initialize the places list UI
        this.createPlacesList();
    }

    /**
     * Initialize all places data
     * Add new places here - each place should have coordinates, name, description, etc.
     */
    initializePlaces() {
        return places;
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

        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-strong').trim();
        const marker = new maplibregl.Marker({ color: accent || '#2f8cf5' })
            .setLngLat(place.coordinates)
            .addTo(this.mapTilerMap);

        // Create popup using MapTiler's native popup
        const popup = this.createNativePopup(place);
        
        // Use MapTiler's native event handling
        marker.getElement().addEventListener('click', () => {
            console.log('Marker clicked!', place.name);
            
            // Close any previously opened popup
            if (this.activePopup) {
                this.activePopup.remove();
            }
            
            popup.setLngLat(place.coordinates).addTo(this.mapTilerMap);
            this.activePopup = popup;
            this.keepPopupInView(popup);
            
            // Add click handlers for photos after popup is added
            setTimeout(() => {
                this.addPhotoClickHandlers(place, popup.getElement());
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
        const previewCount = place.photos.length > 3 ? 2 : 3;
        const popupContent = `
            <div class="place-popup">
                <h3 class="popup-title">${place.name}</h3>
                <p class="popup-description">${place.description}</p>
                <p class="popup-date">Visit Date: ${place.visitDate}</p>
                ${place.photos.length > 0 ? `
                    <div class="popup-photos">
                        <div class="photo-preview-grid">
                            ${place.photos.slice(0, previewCount).map(photo => {
                                const photoSrc = typeof photo === 'string' ? photo : photo.src;
                                const thumbnailSrc = this.getThumbnailPath(photoSrc, 'preview');
                                const isPhotosphere = typeof photo === 'object' && photo.isPhotosphere;
                                const icon = isPhotosphere ? getIcon('Globe') : getIcon('Camera');
                                return `
                                    <div class="photo-preview" data-photosphere="${isPhotosphere}" data-full-src="${photoSrc}">
                                        <img src="${thumbnailSrc}" alt="${place.name} photo" class="preview-thumbnail" loading="lazy" />
                                        <div class="preview-overlay">
                                            <span class="preview-icon">${icon}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            ${place.photos.length > previewCount ? `<button type="button" class="more-photos-indicator" aria-label="Show all photos">+${place.photos.length - previewCount}</button>` : ''}
                        </div>
                        <div class="photo-actions">
                            <button class="btn btn-primary btn-sm view-all-photos-btn" data-place-id="${place.id}">
                                ${getIcon('Camera')} View All ${place.photos.length} Photo${place.photos.length > 1 ? 's' : ''}
                            </button>
                        </div>
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
        return popup;
    }

    /**
     * Viewport area that is not covered by the places list, the toolbar or the bottom button
     */
    getFreeMapArea() {
        const margin = 16;
        const area = {
            top: 80,
            left: margin,
            right: window.innerWidth - margin,
            bottom: window.innerHeight - 90
        };

        const list = this.placesListElement;
        if (list && list.style.display !== 'none') {
            const rect = list.getBoundingClientRect();
            if (this.isMobile) {
                area.bottom = Math.min(area.bottom, rect.top - margin);
            } else {
                area.left = Math.max(area.left, rect.right + margin);
            }
        }
        return area;
    }

    /**
     * Pan the map so the popup is not hidden behind overlaid UI
     */
    keepPopupInView(popup) {
        requestAnimationFrame(() => {
            const el = popup.getElement();
            if (!el || !popup.isOpen()) return;

            const rect = el.getBoundingClientRect();
            const area = this.getFreeMapArea();
            let dx = 0;
            let dy = 0;

            if (rect.left < area.left) dx = rect.left - area.left;
            else if (rect.right > area.right) dx = rect.right - area.right;

            if (rect.top < area.top) dy = rect.top - area.top;
            else if (rect.bottom > area.bottom) dy = Math.min(rect.bottom - area.bottom, rect.top - area.top);

            if (dx || dy) {
                this.mapTilerMap.panBy([dx, dy], { duration: 500 });
            }
        });
    }

    /**
     * Get the thumbnail path for a given photo source and size
     */
    getThumbnailPath(photoSrc, size = 'preview') {
        // Extract filename from path
        const filename = photoSrc.split('/').pop();
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        
        // Return thumbnail path
        return `textures/photos/thumbnails/${nameWithoutExt}_${size}.webp`;
    }

    /**
     * Add click handlers for photos in the popup
     */
    addPhotoClickHandlers(place, containerElement: ParentNode = document) {
        if (!containerElement) return;
        
        // Handle preview thumbnail clicks
        const photoPreviews = containerElement.querySelectorAll('.photo-preview');
        photoPreviews.forEach((preview, index) => {
            preview.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent popup from closing
                const fullSrc = preview.getAttribute('data-full-src');
                const isPhotosphere = preview.getAttribute('data-photosphere') === 'true';
                // Find the index of this photo in the place's photos array
                const photoIndex = place.photos.findIndex(photo => {
                    const photoSrc = typeof photo === 'string' ? photo : photo.src;
                    return photoSrc === fullSrc;
                });
                this.modal.showPhotoModal(fullSrc, place.name, isPhotosphere, place, photoIndex >= 0 ? photoIndex : 0, {
                    onOpen: () => this.disableMapInteractions(),
                    onClose: () => this.enableMapInteractions()
                });
            });
        });
        
        // Handle "View All Photos" button and "+N" tile clicks
        containerElement.querySelectorAll('.view-all-photos-btn, .more-photos-indicator').forEach(viewAllBtn => {
            viewAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent popup from closing
                this.modal.showPhotoGalleryModal(place, {
                    onOpen: () => this.disableMapInteractions(),
                    onClose: () => this.enableMapInteractions()
                });
            });
        });
    }

    /**
     * Disable map interactions (zoom, pan, etc.)
     */
    disableMapInteractions() {
        if (this.mapTilerMap) {
            // Disable all map interactions
            this.mapTilerMap.boxZoom.disable();
            this.mapTilerMap.doubleClickZoom.disable();
            this.mapTilerMap.dragPan.disable();
            this.mapTilerMap.dragRotate.disable();
            this.mapTilerMap.keyboard.disable();
            this.mapTilerMap.scrollZoom.disable();
            this.mapTilerMap.touchZoomRotate.disable();
            
            // Store original cursor and set to default
            this.originalMapCursor = this.mapTilerMap.getCanvas().style.cursor;
            this.mapTilerMap.getCanvas().style.cursor = 'default';
            
            console.log('Map interactions disabled');
        }
    }

    /**
     * Re-enable map interactions
     */
    enableMapInteractions() {
        if (this.mapTilerMap) {
            // Re-enable all map interactions
            this.mapTilerMap.boxZoom.enable();
            this.mapTilerMap.doubleClickZoom.enable();
            this.mapTilerMap.dragPan.enable();
            this.mapTilerMap.dragRotate.enable();
            this.mapTilerMap.keyboard.enable();
            this.mapTilerMap.scrollZoom.enable();
            this.mapTilerMap.touchZoomRotate.enable();
            
            // Restore original cursor
            if (this.originalMapCursor) {
                this.mapTilerMap.getCanvas().style.cursor = this.originalMapCursor;
            }
            
            console.log('Map interactions enabled');
        }
    }



    /**
     * Create the places list sidebar
     */
    createPlacesList() {
        // Detect if we're on mobile
        this.isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        
        // Create the main container
        this.placesListElement = document.createElement('div');
        this.placesListElement.className = 'places-list-container';
        
        // Add mobile class if on mobile device
        if (this.isMobile) {
            this.placesListElement.classList.add('mobile');
        }
        
        // Create header with toggle button
        const header = document.createElement('div');
        header.className = 'places-list-header';
        header.innerHTML = `
            <span class="places-list-title">${getIcon('MapPin')} ${this.isMobile ? 'Places to Visit' : 'My Places'}</span>
            <button class="places-list-toggle icon-btn" title="Toggle places list" aria-label="Toggle places list">
                <span class="toggle-icon">${this.isMobile ? getIcon('ChevronUp') : getIcon('ChevronDown')}</span>
                <span class="hamburger-icon" style="display: none;">${getIcon('Menu')}</span>
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
        
        // Add mobile-specific functionality
        if (this.isMobile) {
            this.setupMobileFunctionality();
            //this.createMobileBackdrop();
            this.adjustBackButtonPosition();
        }
        
        // Add to the page
        document.body.appendChild(this.placesListElement);
        
        // Add styles
        console.log(`Places list created and added to page (${this.isMobile ? 'mobile' : 'desktop'} layout)`);
    }

    /**
     * Setup toggle functionality for the places list
     */
    setupToggleFunctionality() {
        const placesList = this.placesListElement;
        if (!placesList) return;
        const toggleButton = placesList.querySelector('.places-list-toggle') as HTMLElement;
        const listContainer = placesList.querySelector('.places-list') as HTMLElement;
        const toggleIcon = placesList.querySelector('.toggle-icon') as HTMLElement;
        const hamburgerIcon = placesList.querySelector('.hamburger-icon') as HTMLElement;
        
        // Check if we're on mobile and start collapsed
        this.isListCollapsed = this.isMobile; // Start collapsed on mobile
        
        if (toggleButton && listContainer && toggleIcon && hamburgerIcon) {
            // Set initial state
            if (this.isListCollapsed) {
                if (this.isMobile) {
                    // On mobile, show collapsed state (only header visible)
                    placesList.classList.add('collapsed');
                    // Ensure backdrop is hidden initially
                    if (this.backdropElement) {
                        this.backdropElement.classList.remove('visible');
                    }
                    // Set correct arrow direction for mobile (up when collapsed)
                    toggleIcon.innerHTML = getIcon('ChevronUp');
                } else {
                    // On desktop, hide the list content
                    listContainer.style.display = 'none';
                    toggleIcon.style.display = 'none';
                    hamburgerIcon.style.display = 'block';
                    placesList.classList.add('collapsed');
                }
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
        const placesList = this.placesListElement;
        if (!placesList) return;
        const listContainer = placesList.querySelector('.places-list') as HTMLElement;
        const toggleIcon = placesList.querySelector('.toggle-icon') as HTMLElement;
        const hamburgerIcon = placesList.querySelector('.hamburger-icon') as HTMLElement;
        
        if (listContainer && toggleIcon && hamburgerIcon) {
            this.isListCollapsed = !this.isListCollapsed;
            
            if (this.isMobile) {
                // Mobile bottom sheet behavior
                if (this.isListCollapsed) {
                    placesList.classList.add('collapsed');
                    if (this.backdropElement) {
                        this.backdropElement.classList.remove('visible');
                    }
                    // Update arrow to point up (expand)
                    toggleIcon.innerHTML = getIcon('ChevronUp');
                } else {
                    placesList.classList.remove('collapsed');
                    if (this.backdropElement) {
                        this.backdropElement.classList.add('visible');
                    }
                    // Update arrow to point down (collapse)
                    toggleIcon.innerHTML = getIcon('ChevronDown');
                }
            } else {
                // Desktop sidebar behavior
                if (this.isListCollapsed) {
                    listContainer.style.display = 'none';
                    toggleIcon.style.display = 'none';
                    hamburgerIcon.style.display = 'block';
                    placesList.classList.add('collapsed');
                } else {
                    listContainer.style.display = 'block';
                    toggleIcon.style.display = 'block';
                    hamburgerIcon.style.display = 'none';
                    placesList.classList.remove('collapsed');
                }
            }
        }
    }

    /**
     * Adjust back button position on mobile to avoid interference
     */
    adjustBackButtonPosition() {
        const backButton = document.getElementById('back-to-beginning-btn');
        if (backButton && this.isMobile) {
            // Move the back button up to avoid interference with the mobile sidebar
            backButton.style.bottom = '80px';
            console.log('Adjusted back button position for mobile sidebar');
        }
    }

    /**
     * Create mobile backdrop overlay
     */
    createMobileBackdrop() {
        this.backdropElement = document.createElement('div');
        this.backdropElement.className = 'places-list-backdrop';
        
        // Add click handler to close the sidebar
        this.backdropElement.addEventListener('click', () => {
            this.togglePlacesList();
        });
        
        // Add to page
        document.body.appendChild(this.backdropElement);
    }

    /**
     * Setup mobile-specific functionality (touch gestures, etc.)
     */
    setupMobileFunctionality() {
        const header = this.placesListElement?.querySelector('.places-list-header') as HTMLElement | null;
        
        if (!header) return;
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let startTime = 0;
        
        // Touch start
        header.addEventListener('touchstart', (e: TouchEvent) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = true;
            header.style.cursor = 'grabbing';
        }, { passive: true });
        
        // Touch move
        header.addEventListener('touchmove', (e: TouchEvent) => {
            if (!isDragging) return;
            
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Only allow dragging in the direction that makes sense
            if (this.isListCollapsed && deltaY < 0) {
                // Dragging up when collapsed - expand
                e.preventDefault();
                this.togglePlacesList();
                isDragging = false;
            } else if (!this.isListCollapsed && deltaY > 50) {
                // Dragging down when expanded - collapse
                e.preventDefault();
                this.togglePlacesList();
                isDragging = false;
            }
        }, { passive: false });
        
        // Touch end
        header.addEventListener('touchend', (e: TouchEvent) => {
            if (!isDragging) return;
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            const deltaY = currentY - startY;
            
            // Quick tap - toggle
            if (duration < 200 && Math.abs(deltaY) < 10) {
                this.togglePlacesList();
            }
            
            isDragging = false;
            header.style.cursor = 'grab';
        }, { passive: true });
        
        // Mouse events for desktop testing
        header.addEventListener('mousedown', (e: MouseEvent) => {
            startY = e.clientY;
            startTime = Date.now();
            isDragging = true;
            header.style.cursor = 'grabbing';
        });
        
        header.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isDragging) return;
            
            currentY = e.clientY;
            const deltaY = currentY - startY;
            
            if (this.isListCollapsed && deltaY < -20) {
                this.togglePlacesList();
                isDragging = false;
            } else if (!this.isListCollapsed && deltaY > 50) {
                this.togglePlacesList();
                isDragging = false;
            }
        });
        
        header.addEventListener('mouseup', (e: MouseEvent) => {
            if (!isDragging) return;
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            const deltaY = currentY - startY;
            
            if (duration < 200 && Math.abs(deltaY) < 10) {
                this.togglePlacesList();
            }
            
            isDragging = false;
            header.style.cursor = 'grab';
        });
        
        // Prevent text selection during drag
        header.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
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
            <div class="place-fly-button">${getIcon('Plane')}</div>
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
            'historic_site': `${getIcon('Landmark')} Historic Site`,
            'vacation': `${getIcon('Palmtree')} Vacation`,
            'work': `${getIcon('Briefcase')} Work`,
            'nature': `${getIcon('TreePine')} Nature`
        };
        return typeMap[type] || `${getIcon('MapPin')} Place`;
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
        
        // Open the marker popup after the flyTo animation completes
        clearTimeout(this.popupTimer);
        this.popupTimer = setTimeout(() => {
            this.openMarkerPopup(place);
        }, 2100); // Wait slightly longer than the flyTo duration
        
        // Keep the places list open after flying
    }

    /**
     * Open the popup for a specific place's marker
     */
    openMarkerPopup(place) {
        const marker = this.markers.get(place.id);
        if (marker) {
            // Close any previously opened popup
            if (this.activePopup) {
                this.activePopup.remove();
            }
            
            // Create and show the popup
            const popup = this.createNativePopup(place);
            popup.setLngLat(place.coordinates).addTo(this.mapTilerMap);
            this.activePopup = popup;
            this.keepPopupInView(popup);
            
            // Add photo click handlers after popup is shown
            setTimeout(() => {
                this.addPhotoClickHandlers(place);
            }, 100);
            
            console.log(`Opened popup for ${place.name}`);
        } else {
            console.warn(`Marker not found for place: ${place.name}`);
        }
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

    /**
     * Reset and clear all open popups, modals, and overlays
     */
    resetAllStates() {
        // Find and remove all popups
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach(popup => popup.remove());

        this.activePopup = null;
        clearTimeout(this.popupTimer);

        // The map is being reset, so its interactions have to stay off
        this.modal?.closeActiveModal(false);
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
        }
        
        if (this.backdropElement) {
            this.backdropElement.remove();
            this.backdropElement = null;
        }
        
        console.log('Places list removed from page');
    }

    /**
     * Show/hide the places list
     */
    setPlacesListVisibility(visible: boolean) {
        const list = this.placesListElement;
        if (!list || visible === this.isListVisible) return;
        this.isListVisible = visible;

        // A pending step of the opposite transition must not overrule this one
        clearTimeout(this.listVisibilityTimer);

        if (visible) {
            list.style.display = '';
            if (this.isMobile) {
                // The sheet needs one rendered frame with display set before it can slide in
                this.listVisibilityTimer = setTimeout(() => {
                    list.classList.add('visible');
                    this.backdropElement?.classList.add('visible');
                }, 50);
            }
        } else if (this.isMobile) {
            list.classList.remove('visible');
            this.backdropElement?.classList.remove('visible');
            this.listVisibilityTimer = setTimeout(() => {
                list.style.display = 'none';
            }, 300);
        } else {
            list.style.display = 'none';
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

