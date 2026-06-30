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
        this.activePopup = null; // Track the currently open popup
        
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
                visitDate: 'October 2022 - November 2024',
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
                    },
                    
                    {
                        src: 'textures/photos/PXL_20221015_115356533.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20221015_115629967.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20221016_100536586.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_102754081.RAW-01.COVER.jpg',
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
                    },
                    {
                        src: 'textures/photos/20241102_132908.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_102815695.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_102826919.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_102907796.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103216524.RAW-01.MP.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103244091.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103245906.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103536911.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103547754.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103644688.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_103739902.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_104000380.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_104025670.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20241102_104224604.RAW-01.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    }
                ],
                stories: ["test story"] // Add stories here later
            },
            {
                id: 'erbil-jalil-khayat-mosque',
                name: 'Erbil Jalil Khayat Mosque',
                // 36°12′04″N 44°01′07″E
                // convert to decimal degrees
                // 36.1204, 44.0107
                coordinates: [44.018547, 36.201065],
                description: 'A beautiful mosque in Erbil, Iraq.',
                visitDate: 'October 2022 - November 2024',
                type: 'historic_site',
                importance: 'high',
                photos: [
                    {
                        src: 'textures/photos/PXL_20241102_141808163.RAW-01.MP.COVER.jpg',
                        isPhotosphere: false,
                        caption: ''
                    },
                    {
                        src: 'textures/photos/PXL_20221015_150921206.jpg',
                        isPhotosphere: false,
                        caption: ''
                    }
                ],
                stories: [] // Add stories here later
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
            
            // Close any previously opened popup
            if (this.activePopup) {
                this.activePopup.remove();
            }
            
            popup.setLngLat(place.coordinates).addTo(this.mapTilerMap);
            this.activePopup = popup;
            
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
        const popupContent = `
            <div class="place-popup">
                <h3 class="popup-title">${place.name}</h3>
                <p class="popup-description">${place.description}</p>
                <p class="popup-date">Visit Date: ${place.visitDate}</p>
                ${place.photos.length > 0 ? `
                    <div class="popup-photos">
                        <div class="photo-preview-grid">
                            ${place.photos.slice(0, 4).map(photo => {
                                const photoSrc = typeof photo === 'string' ? photo : photo.src;
                                const thumbnailSrc = this.getThumbnailPath(photoSrc, 'preview');
                                const isPhotosphere = typeof photo === 'object' && photo.isPhotosphere;
                                const icon = isPhotosphere ? '🌐' : '📸';
                                return `
                                    <div class="photo-preview" data-photosphere="${isPhotosphere}" data-full-src="${photoSrc}">
                                        <img src="${thumbnailSrc}" alt="${place.name} photo" class="preview-thumbnail" loading="lazy" />
                                        <div class="preview-overlay">
                                            <span class="preview-icon">${icon}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            ${place.photos.length > 4 ? `<div class="more-photos-indicator">+${place.photos.length - 4}</div>` : ''}
                        </div>
                        <div class="photo-actions">
                            <button class="view-all-photos-btn" data-place-id="${place.id}">
                                📷 View All ${place.photos.length} Photo${place.photos.length > 1 ? 's' : ''}
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
     * Get the thumbnail path for a given photo source and size
     */
    getThumbnailPath(photoSrc, size = 'preview') {
        // Extract filename from path
        const filename = photoSrc.split('/').pop();
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        
        // Return thumbnail path
        return `textures/photos/thumbnails/${nameWithoutExt}_${size}.jpg`;
    }

    /**
     * Add click handlers for photos in the popup
     */
    addPhotoClickHandlers(place, containerElement = document) {
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
                this.showPhotoModal(fullSrc, place.name, isPhotosphere, place, photoIndex >= 0 ? photoIndex : 0);
            });
        });
        
        // Handle "View All Photos" button click
        const viewAllBtn = containerElement.querySelector('.view-all-photos-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent popup from closing
                this.showPhotoGalleryModal(place);
            });
        }
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
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
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
        
        // Re-enable body scrolling
        document.body.style.overflow = '';
    }

    /**
     * Show a modal with the full-size photo or photosphere viewer
     */
    showPhotoModal(photoSrc, placeName, isPhotosphere = false, place = null, currentIndex = 0) {
        // Disable map interactions when opening photo modal
        this.disableMapInteractions();
        
        if (isPhotosphere) {
            this.showPhotosphereModal(photoSrc, placeName, place, currentIndex);
        } else {
            this.showRegularPhotoModal(photoSrc, placeName, place, currentIndex);
        }
    }

    /**
     * Show a gallery modal with all photos for a place
     */
    showPhotoGalleryModal(place) {
        // Disable map interactions when opening gallery modal
        this.disableMapInteractions();
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'photo-gallery-modal-overlay';
        modal.innerHTML = `
            <div class="photo-gallery-modal">
                <div class="photo-gallery-header">
                    <h3>${place.name} - Photo Gallery</h3>
                    <button class="photo-gallery-close">&times;</button>
                </div>
                <div class="photo-gallery-content">
                    <div class="photo-grid">
                        ${place.photos.map((photo, index) => {
                            const photoSrc = typeof photo === 'string' ? photo : photo.src;
                            const thumbnailSrc = this.getThumbnailPath(photoSrc, 'gallery');
                            const photoCaption = typeof photo === 'object' && photo.caption ? photo.caption : '';
                            const isPhotosphere = typeof photo === 'object' && photo.isPhotosphere;
                            const icon = isPhotosphere ? '🌐' : '📸';
                            return `
                                <div class="gallery-photo-item" data-index="${index}" data-full-src="${photoSrc}" data-photosphere="${isPhotosphere}">
                                    <img src="${thumbnailSrc}" alt="${place.name} photo ${index + 1}" class="gallery-thumbnail" loading="lazy" />
                                    <div class="gallery-photo-overlay">
                                        <span class="gallery-photo-icon">${icon}</span>
                                        ${photoCaption ? `<span class="gallery-photo-caption">${photoCaption}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not already added
        // Add to page
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.photo-gallery-close');
        const closeModal = () => {
            // Re-enable map interactions when closing gallery modal
            this.enableMapInteractions();
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Add click handlers for gallery photos
        const galleryPhotos = modal.querySelectorAll('.gallery-photo-item');
        galleryPhotos.forEach((photoItem) => {
            photoItem.addEventListener('click', () => {
                const fullSrc = photoItem.getAttribute('data-full-src');
                const isPhotosphere = photoItem.getAttribute('data-photosphere') === 'true';
                const index = parseInt(photoItem.getAttribute('data-index'));
                this.showPhotoModal(fullSrc, place.name, isPhotosphere, place, index);
            });
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
     * Show a regular photo modal
     */
    showRegularPhotoModal(photoSrc, placeName, place = null, currentIndex = 0) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'photo-modal-overlay';
        
        // Get photo data for navigation
        const photos = place ? place.photos : [{ src: photoSrc, isPhotosphere: false, caption: '' }];
        const totalPhotos = photos.length;
        const currentPhoto = photos[currentIndex];
        const currentPhotoSrc = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto.src;
        
        console.log('Regular photo modal data:', { place, photos, currentIndex, currentPhoto, currentPhotoSrc });
        
        modal.innerHTML = `
            <div class="photo-modal">
                <div class="photo-modal-header">
                    <h3>${placeName}</h3>
                    <div class="photo-counter">${currentIndex + 1} / ${totalPhotos}</div>
                    <button class="photo-modal-close">&times;</button>
                </div>
                <div class="photo-modal-content">
                    <div class="photo-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading full-size image...</p>
                    </div>
                    <img src="${currentPhotoSrc}" alt="${placeName} photo" class="photo-modal-image" style="display: none;" />
                    ${totalPhotos > 1 ? `
                        <button class="photo-nav-btn photo-nav-prev" ${currentIndex === 0 ? 'disabled' : ''}>
                            <span>‹</span>
                        </button>
                        <button class="photo-nav-btn photo-nav-next" ${currentIndex === totalPhotos - 1 ? 'disabled' : ''}>
                            <span>›</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add modal styles if not already added
        // Add to page
        document.body.appendChild(modal);
        
        // Handle image loading safely (handles cached images)
        const img = modal.querySelector('.photo-modal-image');
        const loadingDiv = modal.querySelector('.photo-loading');
        
        const handleImageLoad = () => {
            loadingDiv.style.display = 'none';
            img.style.display = 'block';
        };

        if (img.complete) {
            handleImageLoad();
        } else {
            img.addEventListener('load', handleImageLoad);
            img.addEventListener('error', () => {
                loadingDiv.innerHTML = '<p style="color: #ff4444;">Error loading image</p>';
            });
        }
        
        // Navigation functions
        const navigateToPhoto = (newIndex) => {
            if (newIndex < 0 || newIndex >= totalPhotos) return;
            
            const newPhoto = photos[newIndex];
            const newPhotoSrc = typeof newPhoto === 'string' ? newPhoto : newPhoto.src;
            const isNewPhotoPhotosphere = typeof newPhoto === 'object' && newPhoto.isPhotosphere === true;
            
            console.log(`Navigating to photo ${newIndex + 1}:`, { newPhoto, isNewPhotoPhotosphere, newPhotoSrc });
            
            // If switching to a photosphere, close this modal and open photosphere modal
            if (isNewPhotoPhotosphere) {
                console.log('Switching to photosphere modal', { newIndex, newPhotoSrc, placeName, place });
                // Don't re-enable map interactions when switching modal types
                modal.remove();
                this.showPhotosphereModal(newPhotoSrc, placeName, place, newIndex);
                return;
            }
            
            // Show loading
            loadingDiv.style.display = 'flex';
            img.style.display = 'none';
            
            // Update image source
            img.src = newPhotoSrc;
            img.alt = `${placeName} photo ${newIndex + 1}`;
            
            // Check if the new image is already cached
            if (img.complete) {
                loadingDiv.style.display = 'none';
                img.style.display = 'block';
            }
            
            // Update counter
            const counter = modal.querySelector('.photo-counter');
            counter.textContent = `${newIndex + 1} / ${totalPhotos}`;
            
            // Update navigation buttons
            const prevBtn = modal.querySelector('.photo-nav-prev');
            const nextBtn = modal.querySelector('.photo-nav-next');
            
            if (prevBtn) {
                prevBtn.disabled = newIndex === 0;
            }
            if (nextBtn) {
                nextBtn.disabled = newIndex === totalPhotos - 1;
            }
            
            // Store current index for keyboard navigation
            modal.dataset.currentIndex = newIndex;
        };
        
        // Add event listeners
        const closeBtn = modal.querySelector('.photo-modal-close');
        const prevBtn = modal.querySelector('.photo-nav-prev');
        const nextBtn = modal.querySelector('.photo-nav-next');
        
        const closeModal = () => {
            // Re-enable map interactions when closing photo modal
            this.enableMapInteractions();
            modal.remove();
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Navigation button events
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                console.log('Regular photo prev button clicked', { currentIndex, newIndex: currentIndex - 1 });
                navigateToPhoto(currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                console.log('Regular photo next button clicked', { currentIndex, newIndex: currentIndex + 1 });
                navigateToPhoto(currentIndex + 1);
            });
        }
        
        // Keyboard navigation
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            } else if (e.key === 'ArrowLeft' && totalPhotos > 1) {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && totalPhotos > 1) {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(currentIndex + 1);
            }
        };
        
        // Store initial index
        modal.dataset.currentIndex = currentIndex;
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Show a photosphere viewer modal with navigation
     */
    showPhotosphereModal(photoSrc, placeName, place = null, currentIndex = 0) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'photosphere-modal-overlay';
        // Get photo data for navigation
        const photos = place ? place.photos : [{ src: photoSrc, isPhotosphere: true, caption: '' }];
        const totalPhotos = photos.length;
        const currentPhoto = photos[currentIndex];
        const currentPhotoSrc = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto.src;
        
        console.log('Photosphere modal data:', { place, photos, currentIndex, currentPhoto, currentPhotoSrc });
        
        modal.innerHTML = `
            <div class="photosphere-modal">
                <div class="photosphere-modal-header">
                    <h3>${placeName} - 360° View</h3>
                    <div class="photosphere-controls">
                        ${totalPhotos > 1 ? `<div class="photo-counter">${currentIndex + 1} / ${totalPhotos}</div>` : ''}
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
                    ${totalPhotos > 1 ? `
                        <button class="photo-nav-btn photo-nav-prev" ${currentIndex === 0 ? 'disabled' : ''} title="Previous photo">
                            <span>‹</span>
                        </button>
                        <button class="photo-nav-btn photo-nav-next" ${currentIndex === totalPhotos - 1 ? 'disabled' : ''} title="Next photo">
                            <span>›</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add modal styles if not already added
        // Add to page
        document.body.appendChild(modal);
        console.log('Photosphere modal added to DOM:', modal);
        
        // Initialize the photosphere viewer
        this.initPhotosphereViewer(currentPhotoSrc, placeName).catch(error => {
            console.error('Error initializing photosphere viewer:', error);
            const loading = modal.querySelector('.photosphere-loading');
            if (loading) {
                loading.textContent = 'Error loading 360° viewer';
                loading.style.color = '#ff4444';
            }
        });
        
        // Navigation functions for photosphere
        const navigateToPhoto = (newIndex) => {
            if (newIndex < 0 || newIndex >= totalPhotos) return;
            
            const newPhoto = photos[newIndex];
            const newPhotoSrc = typeof newPhoto === 'string' ? newPhoto : newPhoto.src;
            const isNewPhotoPhotosphere = typeof newPhoto === 'object' && newPhoto.isPhotosphere === true;
            
            console.log(`Navigating to photo ${newIndex + 1}:`, { newPhoto, isNewPhotoPhotosphere, newPhotoSrc });
            
            // If switching to a regular photo, close this modal and open regular photo modal
            if (!isNewPhotoPhotosphere) {
                console.log('Switching to regular photo modal', { newIndex, newPhotoSrc, placeName, place });
                // Don't re-enable map interactions when switching modal types
                modal.remove();
                this.showRegularPhotoModal(newPhotoSrc, placeName, place, newIndex);
                return;
            }
            
            // Update counter
            const counter = modal.querySelector('.photo-counter');
            if (counter) {
                counter.textContent = `${newIndex + 1} / ${totalPhotos}`;
            }
            
            // Update navigation buttons
            const prevBtn = modal.querySelector('.photo-nav-prev');
            const nextBtn = modal.querySelector('.photo-nav-next');
            
            if (prevBtn) {
                prevBtn.disabled = newIndex === 0;
            }
            if (nextBtn) {
                nextBtn.disabled = newIndex === totalPhotos - 1;
            }
            
            // Store current index
            modal.dataset.currentIndex = newIndex;
            
            // Show loading
            const loading = modal.querySelector('.photosphere-loading');
            if (loading) {
                loading.style.display = 'block';
                loading.textContent = 'Loading 360° view...';
                loading.style.color = '#fff';
            }
            
            // If photosphere viewer exists, just change the panorama
            if (this.photosphereViewer) {
                try {
                    this.photosphereViewer.setPanorama(newPhotoSrc, {
                        caption: placeName
                    });
                    
                    // Hide loading when ready
                    this.photosphereViewer.addEventListener('panorama-loaded', () => {
                        if (loading) {
                            loading.style.display = 'none';
                        }
                    }, { once: true });
                    
                } catch (error) {
                    console.error('Error updating photosphere:', error);
                    // Fallback to recreating the viewer
                    this.photosphereViewer.destroy();
                    this.photosphereViewer = null;
                    this.initPhotosphereViewer(newPhotoSrc, placeName).catch(error => {
                        console.error('Error initializing photosphere viewer:', error);
                        if (loading) {
                            loading.textContent = 'Error loading 360° viewer';
                            loading.style.color = '#ff4444';
                        }
                    });
                }
            } else {
                // Initialize new photosphere if viewer doesn't exist
                this.initPhotosphereViewer(newPhotoSrc, placeName).catch(error => {
                    console.error('Error initializing photosphere viewer:', error);
                    if (loading) {
                        loading.textContent = 'Error loading 360° viewer';
                        loading.style.color = '#ff4444';
                    }
                });
            }
        };
        
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
            // Re-enable map interactions when closing photosphere modal
            this.enableMapInteractions();
            modal.remove();
        };
        
        // Add event listeners
        const addButtonListeners = () => {
            const closeBtn = modal.querySelector('.photosphere-close');
            const fullscreenBtn = modal.querySelector('.photosphere-fullscreen');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                });
            }
            
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.photosphereViewer) {
                        this.photosphereViewer.toggleFullscreen();
                    }
                });
            }
            
            // Add navigation button listeners
            const prevBtn = modal.querySelector('.photo-nav-prev');
            const nextBtn = modal.querySelector('.photo-nav-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                    console.log('Photosphere prev button clicked', { currentIndex, newIndex: currentIndex - 1 });
                    navigateToPhoto(currentIndex - 1);
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                    console.log('Photosphere next button clicked', { currentIndex, newIndex: currentIndex + 1 });
                    navigateToPhoto(currentIndex + 1);
                });
            }
        };
        
        // Add button listeners once
        addButtonListeners();
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Keyboard navigation
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            } else if (e.key === 'ArrowLeft' && totalPhotos > 1) {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(currentIndex - 1);
            } else if (e.key === 'ArrowRight' && totalPhotos > 1) {
                const currentIndex = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(currentIndex + 1);
            }
        };
        
        // Store initial index
        modal.dataset.currentIndex = currentIndex;
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Add styles for the photo modal
     */
    

    /**
     * Add styles for the photosphere modal
     */
    

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
            // Import Viewer and its CSS dynamically to avoid bundle size issues
            await import('@photo-sphere-viewer/core/index.css');
            const { Viewer } = await import('@photo-sphere-viewer/core');
            this.photosphereViewer = new Viewer({
            container: container,
            panorama: photoSrc,
            caption: placeName,
            loadingImg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2Utb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMjAgMjAiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBzdHJva2Utb3BhY2l0eT0iMC44Ij4KICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHZhbHVlcz0iMCAyMCIvPgo8L2NpcmNsZT4KPC9zdmc+',
            navbar: [
                'zoom',
                'fullscreen',
                'caption'
            ],
            plugins: [
                // Add any plugins you want here
            ],
            defaultZoomLvl: 0,
            minFov: 30,
            maxFov: 90
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
    

    /**
     * Add styles for the photo gallery modal
     */
    

    /**
     * Add styles for the places list
     */
    

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
            <span class="places-list-title">${this.isMobile ? '📍 Places to Visit' : 'My Places'}</span>
            <button class="places-list-toggle" title="Toggle places list">
                <span class="toggle-icon">${this.isMobile ? '▲' : '▼'}</span>
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
        const toggleButton = this.placesListElement.querySelector('.places-list-toggle');
        const listContainer = this.placesListElement.querySelector('.places-list');
        const toggleIcon = this.placesListElement.querySelector('.toggle-icon');
        const hamburgerIcon = this.placesListElement.querySelector('.hamburger-icon');
        
        // Check if we're on mobile and start collapsed
        this.isListCollapsed = this.isMobile; // Start collapsed on mobile
        
        if (toggleButton && listContainer && toggleIcon && hamburgerIcon) {
            // Set initial state
            if (this.isListCollapsed) {
                if (this.isMobile) {
                    // On mobile, show collapsed state (only header visible)
                    this.placesListElement.classList.add('collapsed');
                    // Ensure backdrop is hidden initially
                    if (this.backdropElement) {
                        this.backdropElement.classList.remove('visible');
                    }
                    // Set correct arrow direction for mobile (up when collapsed)
                    toggleIcon.textContent = '▲';
                } else {
                    // On desktop, hide the list content
                    listContainer.style.display = 'none';
                    toggleIcon.style.display = 'none';
                    hamburgerIcon.style.display = 'block';
                    this.placesListElement.classList.add('collapsed');
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
        const listContainer = this.placesListElement.querySelector('.places-list');
        const toggleIcon = this.placesListElement.querySelector('.toggle-icon');
        const hamburgerIcon = this.placesListElement.querySelector('.hamburger-icon');
        
        if (listContainer && toggleIcon && hamburgerIcon) {
            this.isListCollapsed = !this.isListCollapsed;
            
            if (this.isMobile) {
                // Mobile bottom sheet behavior
                if (this.isListCollapsed) {
                    this.placesListElement.classList.add('collapsed');
                    if (this.backdropElement) {
                        this.backdropElement.classList.remove('visible');
                    }
                    // Update arrow to point up (expand)
                    toggleIcon.textContent = '▲';
                } else {
                    this.placesListElement.classList.remove('collapsed');
                    if (this.backdropElement) {
                        this.backdropElement.classList.add('visible');
                    }
                    // Update arrow to point down (collapse)
                    toggleIcon.textContent = '▼';
                }
            } else {
                // Desktop sidebar behavior
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
        const header = this.placesListElement.querySelector('.places-list-header');
        
        if (!header) return;
        
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let startTime = 0;
        
        // Touch start
        header.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = true;
            header.style.cursor = 'grabbing';
        }, { passive: true });
        
        // Touch move
        header.addEventListener('touchmove', (e) => {
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
        header.addEventListener('touchend', (e) => {
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
        header.addEventListener('mousedown', (e) => {
            startY = e.clientY;
            startTime = Date.now();
            isDragging = true;
            header.style.cursor = 'grabbing';
        });
        
        header.addEventListener('mousemove', (e) => {
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
        
        header.addEventListener('mouseup', (e) => {
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
        
        // Open the marker popup after the flyTo animation completes
        setTimeout(() => {
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

        // Find and remove all open modals
        const modals = document.querySelectorAll('.photo-modal-overlay, .photo-gallery-modal-overlay, .photosphere-modal-overlay');
        modals.forEach(modal => modal.remove());

        // Restore map interactions and body scrolling
        this.enableMapInteractions();
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
    setPlacesListVisibility(visible) {
        if (this.placesListElement) {
            if (visible) {
                this.placesListElement.style.display = 'block';
                // On mobile, add a small delay to ensure smooth animation
                if (this.isMobile) {
                    setTimeout(() => {
                        this.placesListElement.classList.add('visible');
                        if (this.backdropElement) {
                            this.backdropElement.classList.add('visible');
                        }
                    }, 50);
                }
            } else {
                if (this.isMobile) {
                    this.placesListElement.classList.remove('visible');
                    if (this.backdropElement) {
                        this.backdropElement.classList.remove('visible');
                    }
                    // Hide after animation completes
                    setTimeout(() => {
                        this.placesListElement.style.display = 'none';
                    }, 300);
                } else {
                    this.placesListElement.style.display = 'none';
                }
            }
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

