import { getIcon } from '../utils/Icons.js';

/**
 * Modal - Handles photo, photosphere, and photo gallery modal functionality
 */
export class Modal {
    activeModal: HTMLDivElement | null;
    photosphereViewer: any;

    constructor() {
        this.activeModal = null;
        this.photosphereViewer = null;
    }

    /**
     * Show a regular photo modal, photosphere modal, or gallery based on parameters
     */
    showPhotoModal(photoSrc: any, placeName: any, isPhotosphere = false, place: any = null, currentIndex = 0, options: any = {}) {
        if (isPhotosphere) {
            this.showPhotosphereModal(photoSrc, placeName, place, currentIndex, options);
        } else {
            this.showRegularPhotoModal(photoSrc, placeName, place, currentIndex, options);
        }
    }

    /**
     * Show a regular photo modal
     */
    showRegularPhotoModal(photoSrc: any, placeName: any, place: any = null, currentIndex = 0, options: any = {}) {
        this.closeActiveModal(false); // Close previous modal but don't call onClose callbacks yet

        if (options.onOpen) {
            options.onOpen();
        }

        const modal = document.createElement('div');
        modal.className = 'photo-modal-overlay';

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

        document.body.appendChild(modal);
        this.activeModal = modal;

        const img = modal.querySelector('.photo-modal-image') as HTMLImageElement;
        const loadingDiv = modal.querySelector('.photo-loading') as HTMLDivElement;

        const handleImageLoad = () => {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (img) img.style.display = 'block';
        };

        if (img && img.complete) {
            handleImageLoad();
        } else if (img) {
            img.addEventListener('load', handleImageLoad);
            img.addEventListener('error', () => {
                if (loadingDiv) loadingDiv.innerHTML = '<p style="color: #ff4444;">Error loading image</p>';
            });
        }

        const navigateToPhoto = (newIndex) => {
            if (newIndex < 0 || newIndex >= totalPhotos) return;

            const newPhoto = photos[newIndex];
            const newPhotoSrc = typeof newPhoto === 'string' ? newPhoto : newPhoto.src;
            const isNewPhotoPhotosphere = typeof newPhoto === 'object' && newPhoto.isPhotosphere === true;

            console.log(`Navigating to photo ${newIndex + 1}:`, { newPhoto, isNewPhotoPhotosphere, newPhotoSrc });

            if (isNewPhotoPhotosphere) {
                console.log('Switching to photosphere modal', { newIndex, newPhotoSrc, placeName, place });
                modal.remove();
                this.showPhotosphereModal(newPhotoSrc, placeName, place, newIndex, options);
                return;
            }

            if (loadingDiv) loadingDiv.style.display = 'flex';
            if (img) img.style.display = 'none';

            if (img) {
                img.src = newPhotoSrc;
                img.alt = `${placeName} photo ${newIndex + 1}`;

                if (img.complete) {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    img.style.display = 'block';
                }
            }

            const counter = modal.querySelector('.photo-counter');
            if (counter) counter.textContent = `${newIndex + 1} / ${totalPhotos}`;

            const prevBtn = modal.querySelector('.photo-nav-prev') as HTMLButtonElement;
            const nextBtn = modal.querySelector('.photo-nav-next') as HTMLButtonElement;

            if (prevBtn) prevBtn.disabled = newIndex === 0;
            if (nextBtn) nextBtn.disabled = newIndex === totalPhotos - 1;

            modal.dataset.currentIndex = newIndex.toString();
        };

        const closeBtn = modal.querySelector('.photo-modal-close');
        const prevBtn = modal.querySelector('.photo-nav-prev');
        const nextBtn = modal.querySelector('.photo-nav-next');

        const closeModal = () => {
            if (options.onClose) {
                options.onClose();
            }
            modal.remove();
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx + 1);
            });
        }

        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            } else if (e.key === 'ArrowLeft' && totalPhotos > 1) {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx - 1);
            } else if (e.key === 'ArrowRight' && totalPhotos > 1) {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx + 1);
            }
        };

        modal.dataset.currentIndex = currentIndex.toString();
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Show a photosphere viewer modal
     */
    showPhotosphereModal(photoSrc: any, placeName: any, place: any = null, currentIndex = 0, options: any = {}) {
        this.closeActiveModal(false); // Close previous modal but don't call onClose callbacks yet

        if (options.onOpen) {
            options.onOpen();
        }

        const modal = document.createElement('div');
        modal.className = 'photosphere-modal-overlay';

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
                        <button class="photosphere-fullscreen" title="Fullscreen">${getIcon('Maximize')}</button>
                        <button class="photosphere-close">&times;</button>
                    </div>
                </div>
                <div class="photosphere-container">
                    <div id="photosphere-canvas"></div>
                    <div class="photosphere-loading">Loading 360° view...</div>
                    <div class="photosphere-instructions">
                        <p>${getIcon('Mouse')} Drag to look around • ${getIcon('Search')} Scroll to zoom • Use controls for more options</p>
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

        document.body.appendChild(modal);
        this.activeModal = modal;

        this.initPhotosphereViewer(currentPhotoSrc, placeName).catch(error => {
            console.error('Error initializing photosphere viewer:', error);
            const loading = modal.querySelector('.photosphere-loading') as HTMLDivElement;
            if (loading) {
                loading.textContent = 'Error loading 360° viewer';
                loading.style.color = '#ff4444';
            }
        });

        const navigateToPhoto = (newIndex) => {
            if (newIndex < 0 || newIndex >= totalPhotos) return;

            const newPhoto = photos[newIndex];
            const newPhotoSrc = typeof newPhoto === 'string' ? newPhoto : newPhoto.src;
            const isNewPhotoPhotosphere = typeof newPhoto === 'object' && newPhoto.isPhotosphere === true;

            console.log(`Navigating to photo ${newIndex + 1}:`, { newPhoto, isNewPhotoPhotosphere, newPhotoSrc });

            if (!isNewPhotoPhotosphere) {
                console.log('Switching to regular photo modal', { newIndex, newPhotoSrc, placeName, place });
                this.destroyPhotosphere();
                modal.remove();
                this.showRegularPhotoModal(newPhotoSrc, placeName, place, newIndex, options);
                return;
            }

            const counter = modal.querySelector('.photo-counter');
            if (counter) counter.textContent = `${newIndex + 1} / ${totalPhotos}`;

            const prevBtn = modal.querySelector('.photo-nav-prev') as HTMLButtonElement;
            const nextBtn = modal.querySelector('.photo-nav-next') as HTMLButtonElement;

            if (prevBtn) prevBtn.disabled = newIndex === 0;
            if (nextBtn) nextBtn.disabled = newIndex === totalPhotos - 1;

            modal.dataset.currentIndex = newIndex.toString();

            const loading = modal.querySelector('.photosphere-loading') as HTMLDivElement;
            if (loading) {
                loading.style.display = 'block';
                loading.textContent = 'Loading 360° view...';
                loading.style.color = '#fff';
            }

            if (this.photosphereViewer) {
                try {
                    this.photosphereViewer.setPanorama(newPhotoSrc, {
                        caption: placeName
                    });

                    this.photosphereViewer.addEventListener('panorama-loaded', () => {
                        if (loading) loading.style.display = 'none';
                    }, { once: true });

                } catch (error) {
                    console.error('Error updating photosphere:', error);
                    this.destroyPhotosphere();
                    this.initPhotosphereViewer(newPhotoSrc, placeName).catch(err => {
                        console.error('Error initializing photosphere viewer:', err);
                        if (loading) {
                            loading.textContent = 'Error loading 360° viewer';
                            loading.style.color = '#ff4444';
                        }
                    });
                }
            } else {
                this.initPhotosphereViewer(newPhotoSrc, placeName).catch(err => {
                    console.error('Error initializing photosphere viewer:', err);
                    if (loading) {
                        loading.textContent = 'Error loading 360° viewer';
                        loading.style.color = '#ff4444';
                    }
                });
            }
        };

        const closeModal = () => {
            console.log('Closing photosphere modal');
            this.destroyPhotosphere();
            if (options.onClose) {
                options.onClose();
            }
            modal.remove();
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
        };

        const closeBtn = modal.querySelector('.photosphere-close');
        const fullscreenBtn = modal.querySelector('.photosphere-fullscreen');
        const prevBtn = modal.querySelector('.photo-nav-prev');
        const nextBtn = modal.querySelector('.photo-nav-next');

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

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx + 1);
            });
        }

        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeydown);
            } else if (e.key === 'ArrowLeft' && totalPhotos > 1) {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx - 1);
            } else if (e.key === 'ArrowRight' && totalPhotos > 1) {
                const idx = parseInt(modal.dataset.currentIndex || '0');
                navigateToPhoto(idx + 1);
            }
        };

        modal.dataset.currentIndex = currentIndex.toString();
        document.addEventListener('keydown', handleKeydown);
    }

    /**
     * Show a gallery modal with all photos for a place
     */
    showPhotoGalleryModal(place: any, options: any = {}) {
        this.closeActiveModal(false);

        if (options.onOpen) {
            options.onOpen();
        }

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
                            const icon = isPhotosphere ? getIcon('Globe') : getIcon('Camera');
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

        document.body.appendChild(modal);
        this.activeModal = modal;

        const closeModal = () => {
            if (options.onClose) {
                options.onClose();
            }
            modal.remove();
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
        };

        const closeBtn = modal.querySelector('.photo-gallery-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        const galleryPhotos = modal.querySelectorAll('.gallery-photo-item');
        galleryPhotos.forEach((photoItem) => {
            photoItem.addEventListener('click', () => {
                const fullSrc = photoItem.getAttribute('data-full-src');
                const isPhotosphere = photoItem.getAttribute('data-photosphere') === 'true';
                const index = parseInt(photoItem.getAttribute('data-index'));
                
                // Transition to photo modal
                this.showPhotoModal(fullSrc, place.name, isPhotosphere, place, index, options);
            });
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Initialize the photosphere viewer
     */
    async initPhotosphereViewer(photoSrc, placeName) {
        const container = document.getElementById('photosphere-canvas');
        if (!container) return;

        try {
            await import('@photo-sphere-viewer/core/index.css');
            const { Viewer } = await import('@photo-sphere-viewer/core');
            this.photosphereViewer = new Viewer({
                container: container,
                panorama: photoSrc,
                caption: placeName,
                loadingImg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2Utb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMjAgMjAiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBzdHJva2Utb3BhY2l0eT0iMC44Ij4KICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHZhbHVlcz0iMCAyMCIvPgo8L2NpcmNsZT4KPC9zdmc+',
                navbar: ['zoom', 'fullscreen', 'caption'],
                defaultZoomLvl: 0,
                minFov: 30,
                maxFov: 90
            });

            this.photosphereViewer.addEventListener('ready', () => {
                const loading = container.parentElement?.querySelector('.photosphere-loading') as HTMLDivElement;
                if (loading) loading.style.display = 'none';
            });
        } catch (error) {
            console.error('Error initializing photosphere viewer:', error);
        }
    }

    /**
     * Get thumbnail path for photos
     */
    getThumbnailPath(photoSrc, size = 'preview') {
        const filename = photoSrc.split('/').pop();
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        return `textures/photos/thumbnails/${nameWithoutExt}_${size}.jpg`;
    }

    /**
     * Destroy the current photosphere viewer
     */
    destroyPhotosphere() {
        if (this.photosphereViewer) {
            try {
                if (typeof this.photosphereViewer.destroy === 'function') {
                    this.photosphereViewer.destroy();
                } else {
                    const container = document.getElementById('photosphere-canvas');
                    if (container) container.innerHTML = '';
                }
            } catch (error) {
                console.warn('Error during photosphere cleanup:', error);
            }
            this.photosphereViewer = null;
        }
    }

    /**
     * Close any active modal
     */
    closeActiveModal(runOnClose = true, options: any = {}) {
        if (this.activeModal) {
            this.destroyPhotosphere();
            if (runOnClose && options.onClose) {
                options.onClose();
            }
            this.activeModal.remove();
            this.activeModal = null;
        }
    }
}
