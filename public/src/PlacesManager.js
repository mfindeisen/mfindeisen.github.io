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
        this.addPopupStyles();
        
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
    addPhotoClickHandlers(place) {
        // Handle preview thumbnail clicks
        const photoPreviews = document.querySelectorAll('.photo-preview');
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
        const viewAllBtn = document.querySelector('.view-all-photos-btn');
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
        this.addPhotoGalleryModalStyles();
        
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
        this.addPhotoModalStyles();
        
        // Add to page
        document.body.appendChild(modal);
        
        // Handle image loading
        const img = modal.querySelector('.photo-modal-image');
        const loadingDiv = modal.querySelector('.photo-loading');
        
        img.addEventListener('load', () => {
            loadingDiv.style.display = 'none';
            img.style.display = 'block';
        });
        
        img.addEventListener('error', () => {
            loadingDiv.innerHTML = '<p style="color: #ff4444;">Error loading image</p>';
        });
        
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
        this.addPhotosphereModalStyles();
        
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
            
            .photo-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                color: #666;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #1a73e8;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .photo-loading p {
                margin: 0;
                font-size: 14px;
            }
            
            /* Photo counter styles */
            .photo-counter {
                color: #666;
                font-size: 14px;
                font-weight: 500;
                margin: 0 16px;
            }
            
            /* Navigation button styles */
            .photo-nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.7);
                border: none;
                color: white;
                font-size: 24px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
                user-select: none;
            }
            
            .photo-nav-btn:hover:not(:disabled) {
                background: rgba(0, 0, 0, 0.9);
                transform: translateY(-50%) scale(1.1);
            }
            
            .photo-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .photo-nav-prev {
                left: 20px;
            }
            
            .photo-nav-next {
                right: 20px;
            }
            
            .photo-modal-content {
                position: relative;
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
                
                /* Mobile navigation adjustments */
                .photo-nav-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .photo-nav-prev {
                    left: 10px;
                }
                
                .photo-nav-next {
                    right: 10px;
                }
                
                .photo-counter {
                    font-size: 12px;
                    margin: 0 8px;
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
                
                /* Mobile navigation adjustments for photosphere */
                .photo-nav-btn {
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                }
                
                .photo-nav-prev {
                    left: 10px;
                }
                
                .photo-nav-next {
                    right: 10px;
                }
                
                .photo-counter {
                    font-size: 12px;
                    margin: 0 8px;
                }
            }
            
            /* Navigation button styles for photosphere modal */
            .photo-nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.7);
                border: none;
                color: white;
                font-size: 24px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 10;
                user-select: none;
            }
            
            .photo-nav-btn:hover:not(:disabled) {
                background: rgba(0, 0, 0, 0.9);
                transform: translateY(-50%) scale(1.1);
            }
            
            .photo-nav-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .photo-nav-prev {
                left: 20px;
            }
            
            .photo-nav-next {
                right: 20px;
            }
            
            .photosphere-container {
                position: relative;
            }
            
            /* Photo counter styles for photosphere */
            .photo-counter {
                color: #ccc;
                font-size: 14px;
                font-weight: 500;
                margin: 0 16px;
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
            }
            
            .photo-preview-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6px;
                margin-bottom: 10px;
            }
            
            .photo-preview {
                position: relative;
                aspect-ratio: 1;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .photo-preview:hover {
                transform: scale(1.05);
            }
            
            .preview-thumbnail {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            
            .preview-overlay {
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
            
            .photo-preview:hover .preview-overlay {
                opacity: 1;
            }
            
            .preview-icon {
                color: white;
                font-size: 16px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
            }
            
            .more-photos-indicator {
                position: relative;
                aspect-ratio: 1;
                background: #f0f0f0;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                color: #666;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .more-photos-indicator:hover {
                background: #e0e0e0;
            }
            
            .photo-actions {
                text-align: center;
            }
            
            .view-all-photos-btn {
                background: #1a73e8;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .view-all-photos-btn:hover {
                background: #1557b0;
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
     * Add styles for the photo gallery modal
     */
    addPhotoGalleryModalStyles() {
        if (document.querySelector('.photo-gallery-modal-styles')) return;
        
        const style = document.createElement('style');
        style.className = 'photo-gallery-modal-styles';
        style.textContent = `
            .photo-gallery-modal-overlay {
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
            
            .photo-gallery-modal {
                background: white;
                border-radius: 12px;
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            }
            
            /* Desktop: Larger modal for better horizontal layout */
            @media (min-width: 769px) {
                .photo-gallery-modal {
                    max-width: 95vw;
                    max-height: 85vh;
                    min-width: 800px;
                }
                
                .photo-gallery-content {
                    padding: 24px;
                }
            }
            
            .photo-gallery-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .photo-gallery-header h3 {
                margin: 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            }
            
            .photo-gallery-close {
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
            
            .photo-gallery-close:hover {
                background-color: #e9ecef;
                color: #333;
            }
            
            .photo-gallery-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .photo-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 12px;
            }
            
            /* Desktop horizontal layout with multiple rows */
            @media (min-width: 769px) {
                .photo-grid {
                    grid-template-columns: repeat(4, 1fr);
                    grid-auto-rows: minmax(150px, auto);
                    gap: 16px;
                    max-width: 100%;
                }
                
                .gallery-photo-item {
                    aspect-ratio: 1;
                    min-height: 150px;
                }
            }
            
            .gallery-photo-item {
                position: relative;
                aspect-ratio: 1;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .gallery-photo-item:hover {
                transform: scale(1.05);
            }
            
            .gallery-thumbnail {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            
            .gallery-photo-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .gallery-photo-item:hover .gallery-photo-overlay {
                opacity: 1;
            }
            
            .gallery-photo-icon {
                color: white;
                font-size: 20px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
            }
            
            .gallery-photo-caption {
                color: white;
                font-size: 11px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                margin-top: 4px;
                text-align: center;
                padding: 0 4px;
            }
            
            @media (max-width: 768px) {
                .photo-gallery-modal {
                    max-width: 95vw;
                    max-height: 95vh;
                }
                
                .photo-gallery-header {
                    padding: 12px 16px;
                }
                
                .photo-gallery-header h3 {
                    font-size: 16px;
                }
                
                .photo-gallery-content {
                    padding: 16px;
                }
                
                /* Mobile: Keep vertical layout with smaller thumbnails */
                .photo-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 8px;
                }
                
                .gallery-photo-item {
                    aspect-ratio: 1;
                    min-height: 120px;
                }
            }
            
            @media (max-width: 480px) {
                .photo-grid {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 6px;
                }
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
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px) saturate(180%);
                -webkit-backdrop-filter: blur(16px) saturate(180%);
                color: rgba(255, 255, 255, 0.9);
                border-right: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 2px 0 16px rgba(0, 0, 0, 0.3);
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
            
            /* Mobile bottom sheet layout - override desktop styles */
            .places-list-container.mobile {
                top: auto !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                height: auto !important;
                max-height: 70vh !important;
                width: 100% !important;
                border-radius: 20px 20px 0 0 !important;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
                transform: translateY(100%) !important;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                z-index: 1001 !important;
            }
            
            .places-list-container.mobile.visible {
                transform: translateY(0) !important;
            }
            
            .places-list-container.mobile.collapsed {
                transform: translateY(calc(100% - 60px)) !important;
                max-height: 60px !important;
            }
            
            /* Mobile backdrop overlay */
            .places-list-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .places-list-backdrop.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .places-list-header {
                background: rgba(0, 0, 0, 0.4);
                color: rgba(255, 255, 255, 0.9);
                padding: 16px 20px;
                font-size: 16px;
                font-weight: 500;
                border-bottom: 1px solid rgba(255, 255, 255, 0.25);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                user-select: none;
                min-height: 56px;
                box-sizing: border-box;
            }
            
            /* Mobile header with drag handle */
            .places-list-container.mobile .places-list-header {
                padding: 12px 20px 16px 20px;
                border-radius: 20px 20px 0 0;
                position: relative;
                cursor: grab;
            }
            
            .places-list-container.mobile .places-list-header:active {
                cursor: grabbing;
            }
            
            .places-list-container.mobile .places-list-header::before {
                content: '';
                position: absolute;
                top: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 4px;
                background: #ccc;
                border-radius: 2px;
            }
            
            .places-list-container.collapsed .places-list-header {
                padding: 16px 12px;
                justify-content: center;
            }
            
            .places-list-title {
                flex: 1;
                font-weight: 500;
                color: rgba(255, 255, 255, 0.9);
            }
            
            .places-list-container.collapsed .places-list-title {
                display: none;
            }
            
            .places-list-toggle {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
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
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
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
                background: transparent;
            }
            
            .place-item {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .place-item:last-child {
                border-bottom: none;
            }
            
            .place-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            .place-item:active {
                background: rgba(255, 255, 255, 0.2);
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
                color: rgba(255, 255, 255, 0.95);
                margin-bottom: 4px;
                line-height: 1.4;
            }
            
            .place-date {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 2px;
            }
            
            .place-type {
                font-size: 12px;
                color: #64b5f6;
                font-weight: 400;
            }
            
            .place-fly-button {
                font-size: 18px;
                color: rgba(255, 255, 255, 0.7);
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
                color: #fff;
                background: rgba(255, 255, 255, 0.2);
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
            
            /* Force mobile layout for mobile devices */
            @media (max-width: 768px) {
                .places-list-container {
                    top: auto !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    height: auto !important;
                    max-height: 70vh !important;
                    width: 100% !important;
                    border-radius: 20px 20px 0 0 !important;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
                    transform: translateY(100%) !important;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    z-index: 1001 !important;
                }
                
                .places-list-container.visible {
                    transform: translateY(0) !important;
                }
                
                .places-list-container.collapsed {
                    transform: translateY(calc(100% - 60px)) !important;
                    max-height: 60px !important;
                }
                
                /* Back button positioning handled by JavaScript */
                
                /* Mobile header with drag handle */
                .places-list-header {
                    padding: 12px 20px 16px 20px !important;
                    border-radius: 20px 20px 0 0 !important;
                    position: relative !important;
                    cursor: grab !important;
                    background: #f8f9fa !important;
                    border-bottom: 1px solid #e0e0e0 !important;
                }
                
                .places-list-header:active {
                    cursor: grabbing !important;
                }
                
                .places-list-header::before {
                    content: '' !important;
                    position: absolute !important;
                    top: 8px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    width: 40px !important;
                    height: 4px !important;
                    background: #ccc !important;
                    border-radius: 2px !important;
                }
                
                /* Make mobile title more prominent */
                .places-list-container .places-list-title {
                    font-weight: 600 !important;
                    color: #1a73e8 !important;
                }
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                /* Desktop sidebar styles for smaller screens */
                .places-list-container:not(.mobile):not(.collapsed) {
                    width: 280px;
                }
                
                .places-list-container:not(.mobile).collapsed {
                    width: 56px;
                }
                
                .places-list-container:not(.mobile) .places-list-header {
                    padding: 12px 16px;
                    font-size: 14px;
                    min-height: 48px;
                }
                
                .places-list-container:not(.mobile).collapsed .places-list-header {
                    padding: 12px 8px;
                }
                
                .places-list-container:not(.mobile) .places-list-toggle {
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
                
                .places-list-container:not(.mobile) .place-item {
                    padding: 12px 16px;
                }
                
                .places-list-container:not(.mobile).collapsed .place-item {
                    padding: 12px 8px;
                }
                
                .places-list-container:not(.mobile) .place-name {
                    font-size: 13px;
                }
                
                .places-list-container:not(.mobile) .place-date {
                    font-size: 11px;
                }
                
                .places-list-container:not(.mobile) .place-type {
                    font-size: 11px;
                }
                
                .places-list-container:not(.mobile) .place-fly-button {
                    width: 36px;
                    height: 36px;
                    font-size: 16px;
                }
                
                .places-list-container:not(.mobile).collapsed .place-fly-button {
                    width: 32px;
                    height: 32px;
                    font-size: 14px;
                }
                
                /* Mobile bottom sheet specific styles */
                .places-list-container.mobile .places-list-header {
                    padding: 12px 20px 16px 20px;
                    font-size: 16px;
                    min-height: 60px;
                }
                
                .places-list-container.mobile .places-list-toggle {
                    width: 40px;
                    height: 40px;
                    font-size: 18px;
                }
                
                .places-list-container.mobile .place-item {
                    padding: 16px 20px;
                }
                
                .places-list-container.mobile .place-name {
                    font-size: 15px;
                }
                
                .places-list-container.mobile .place-date {
                    font-size: 13px;
                }
                
                .places-list-container.mobile .place-type {
                    font-size: 13px;
                }
                
                .places-list-container.mobile .place-fly-button {
                    width: 40px;
                    height: 40px;
                    font-size: 18px;
                }
                
                /* Ensure mobile list is scrollable */
                .places-list-container.mobile .places-list {
                    max-height: calc(70vh - 60px);
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior: contain;
                }
                
                /* Improve mobile touch targets */
                .places-list-container.mobile .place-item {
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                }
                
                /* Better mobile spacing */
                .places-list-container.mobile .place-item-content {
                    flex: 1;
                    min-width: 0; /* Allow text to truncate */
                }
                
                .places-list-container.mobile .place-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
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
        this.addPlacesListStyles();
        
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
            // Create and show the popup
            const popup = this.createNativePopup(place);
            popup.setLngLat(place.coordinates).addTo(this.mapTilerMap);
            
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

