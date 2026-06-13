/**
 * Modal - Handles photo and photosphere modal functionality
 */
export class Modal {
    constructor() {
        this.activeModal = null;
        this.photosphereViewer = null;
    }

    /**
     * Show a regular photo modal
     */
    showPhotoModal(photoSrc, placeName) {
        this.closeActiveModal();
        
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
        
        document.body.appendChild(modal);
        this.activeModal = modal;
        
        this.setupPhotoModalEvents(modal);
    }

    /**
     * Show a photosphere viewer modal
     */
    showPhotosphereModal(photoSrc, placeName) {
        this.closeActiveModal();
        
        const modal = document.createElement('div');
        modal.className = 'photosphere-modal-overlay';
        modal.innerHTML = `
            <div class="photosphere-modal">
                <div class="photosphere-modal-header">
                    <h3>${placeName} - 360° View</h3>
                    <div class="photosphere-controls">
                        <button class="photosphere-reset" title="Reset View">🔄</button>
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
        
        document.body.appendChild(modal);
        this.activeModal = modal;
        
        this.initPhotosphereViewer(photoSrc, placeName);
        this.setupPhotosphereModalEvents(modal);
    }

    /**
     * Initialize the photosphere viewer
     */
    initPhotosphereViewer(photoSrc, placeName) {
        const container = document.getElementById('photosphere-canvas');
        
        if (!container) {
            console.error('Photosphere canvas container not found!');
            return;
        }
        
        try {
            // Import Viewer dynamically to avoid issues
            import('@photo-sphere-viewer/core').then(({ Viewer }) => {
                this.photosphereViewer = new Viewer({
                    container: container,
                    panorama: photoSrc,
                    caption: placeName,
                    loadingImg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2Utb3BhY2l0eT0iMC4zIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWRhc2hhcnJheT0iMjAgMjAiIHN0cm9rZS1kYXNob2Zmc2V0PSIwIiBzdHJva2Utb3BhY2l0eT0iMC44Ij4KICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJzdHJva2UtZGFzaG9mZnNldCIgZHVyPSIxcyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHZhbHVlcz0iMCAyMCIvPgo8L2NpcmNsZT4KPC9zdmc+',
                    navbar: ['autorotate', 'zoom', 'fullscreen', 'caption'],
                    plugins: [],
                    defaultZoomLvl: 0,
                    minFov: 30,
                    maxFov: 90,
                    autorotateLat: 0,
                    autorotateDelay: 1000,
                    autorotateSpeed: '0.5rpm'
                });
                
                this.photosphereViewer.addEventListener('ready', () => {
                    const loading = container.parentElement.querySelector('.photosphere-loading');
                    if (loading) loading.style.display = 'none';
                });
                
                this.photosphereViewer.addEventListener('panorama-error', (e) => {
                    console.error('Failed to load photosphere:', e);
                    const loading = container.parentElement.querySelector('.photosphere-loading');
                    if (loading) {
                        loading.textContent = 'Failed to load 360° view';
                        loading.style.color = '#ff4444';
                    }
                });
            }).catch(error => {
                console.error('Error loading Photo Sphere Viewer:', error);
                const loading = container.parentElement.querySelector('.photosphere-loading');
                if (loading) {
                    loading.textContent = 'Error loading 360° viewer';
                    loading.style.color = '#ff4444';
                }
            });
        } catch (error) {
            console.error('Error initializing photosphere viewer:', error);
        }
    }

    /**
     * Setup photo modal event listeners
     */
    setupPhotoModalEvents(modal) {
        const closeBtn = modal.querySelector('.photo-modal-close');
        const closeModal = () => this.closeModal(modal);
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
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
     * Setup photosphere modal event listeners
     */
    setupPhotosphereModalEvents(modal) {
        const closeModal = () => this.closeModal(modal);
        
        const addButtonListeners = () => {
            const closeBtn = modal.querySelector('.photosphere-close');
            const resetBtn = modal.querySelector('.photosphere-reset');
            const fullscreenBtn = modal.querySelector('.photosphere-fullscreen');
            
            if (closeBtn) {
                closeBtn.replaceWith(closeBtn.cloneNode(true));
                const newCloseBtn = modal.querySelector('.photosphere-close');
                newCloseBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                });
            }
            
            if (resetBtn) {
                resetBtn.replaceWith(resetBtn.cloneNode(true));
                const newResetBtn = modal.querySelector('.photosphere-reset');
                newResetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.photosphereViewer) {
                        this.photosphereViewer.animate({
                            longitude: 0,
                            latitude: 0,
                            zoom: 0
                        });
                    }
                });
            }
            
            if (fullscreenBtn) {
                fullscreenBtn.replaceWith(fullscreenBtn.cloneNode(true));
                const newFullscreenBtn = modal.querySelector('.photosphere-fullscreen');
                newFullscreenBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.photosphereViewer) {
                        this.photosphereViewer.toggleFullscreen();
                    }
                });
            }
        };
        
        addButtonListeners();
        setTimeout(addButtonListeners, 100);
        setTimeout(addButtonListeners, 500);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
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
     * Close a specific modal
     */
    closeModal(modal) {
        if (this.photosphereViewer) {
            try {
                if (typeof this.photosphereViewer.destroy === 'function') {
                    this.photosphereViewer.destroy();
                } else {
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
        if (this.activeModal === modal) {
            this.activeModal = null;
        }
    }

    /**
     * Close any active modal
     */
    closeActiveModal() {
        if (this.activeModal) {
            this.closeModal(this.activeModal);
        }
    }

    /**
     * Add photo modal styles
     */
    addPhotoModalStyles() {
        if (document.querySelector('.photo-modal-styles')) return;
        
        
    }

    /**
     * Add photosphere modal styles
     */
    addPhotosphereModalStyles() {
        if (document.querySelector('.photosphere-modal-styles')) return;
        
        
    }
}
