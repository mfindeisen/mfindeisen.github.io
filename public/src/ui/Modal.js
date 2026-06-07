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
        
        this.addPhotoModalStyles();
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
        
        this.addPhotosphereModalStyles();
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
     * Add photosphere modal styles
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
}
