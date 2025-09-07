import * as THREE from '/three/build/three.module.js';
import { EarthScene } from './EarthScene.js';
import { ScrollController } from './ScrollController.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scrollProgress = document.getElementById('scroll-progress');
        
        // Reset scroll position to 0 on page load/reload
        this.resetScrollPosition();
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }

    resetScrollPosition() {
        // Prevent browser from restoring scroll position
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        
        // Reset scroll to top immediately
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Also reset after a short delay to override browser restoration
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        }, 100);
    }

    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false 
        });
        this.renderer.setClearColor(0x000000); // Black space background
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Create earth scene
        this.earthScene = new EarthScene();
        
        // Create scroll controller
        this.scrollController = new ScrollController();
        
        console.log('Three.js App initialized');
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle scroll
        window.addEventListener('scroll', this.onScroll.bind(this));
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.earthScene.camera.aspect = width / height;
        this.earthScene.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }

    onScroll() {
        const scrollProgress = this.scrollController.getScrollProgress();
        console.log('Scroll event triggered, progress:', scrollProgress);
        this.scrollProgress.textContent = `Progress: ${Math.round(scrollProgress * 100)}%`;
        
        // Test with a simple progress value
        const testProgress = Math.min(window.pageYOffset / 1000, 1); // Simple test
        console.log('Test progress:', testProgress);
        
        // Update earth transformation based on scroll
        this.earthScene.updateTransformation(scrollProgress);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update earth scene
        this.earthScene.update();
        
        // Render
        this.renderer.render(this.earthScene.scene, this.earthScene.camera);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
