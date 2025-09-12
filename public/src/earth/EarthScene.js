import { Lighting } from './Lighting.js';
import { Geometry } from './Geometry.js';
import { Starfield } from './Starfield.js';
import { EasterEggs } from './EasterEggs.js';
import { MouseController } from '../utils/MouseController.js';
import { MathUtils } from '../utils/MathUtils.js';

/**
 * EarthScene - Main class for managing the 3D Earth scene
 */
export class EarthScene {
    constructor(THREE) {
        this.THREE = THREE;
        this.isInitialized = false;
        this.init();
    }

    /**
     * Initialize the Earth scene
     */
    init() {
        if (this.isInitialized) return;
        
        this.scene = new this.THREE.Scene();
        this.camera = new this.THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 0, 15);

        // Initialize components
        this.lighting = new Lighting(this.scene, this.THREE);
        this.geometry = new Geometry(this.scene, this.THREE);
        this.starfield = new Starfield(this.scene, this.THREE);
        this.easterEggs = new EasterEggs(this.scene);
        this.mouseController = new MouseController(this.THREE);
        
        // Initialize state
        this.scrollProgress = 1; // 1 = sphere, 0 = flat
        this.isScrolling = false;
        this.hasStartedMorphing = false;
        this.currentRotationY = 0;
        this.targetRotationY = 0;
        this.rotationSpeed = 0.05;
        this.cloudRotationY = 0;
        
        this.isInitialized = true;
        console.log('EarthScene initialized');
    }

    /**
     * Update transformation based on scroll progress
     */
    updateTransformation(progress) {
        if (!this.geometry.getEarthMesh()) return;
        
        // Mouse rotation disabled - no reset needed
        
        // Convert progress to scrollProgress
        this.scrollProgress = 1 - progress;
        
        // Update geometry transformation
        this.geometry.updateTransformation(progress);
        
        // Track if user has started morphing
        if (progress > 0) {
            this.hasStartedMorphing = true;
        }
        
        // Update lighting during morph
        this.lighting.updateTransformation(progress);
        
        // Handle final zoom phase
        this.handleFinalZoom(progress);
    }

    /**
     * Handle final zoom phase
     */
    handleFinalZoom(progress) {
        const easedProgress = MathUtils.easeInOutCubic(progress);
        let cameraZ = 15;
        
        if (progress < 0.85) {
            // Gradual zoom in during morphing
            cameraZ = 15 - progress * 8; // Zoom from 15 to 7
            this.geometry.getEarthMesh().scale.setScalar(1.0);
        } else {
            // Final zoom phase with scaling for full-screen effect
            const finalProgress = (progress - 0.85) / 0.15;
            const smoothFinal = MathUtils.easeInOutCubic(finalProgress);
            
            cameraZ = 7 - smoothFinal * 4; // Final zoom (7 -> 3)
            
            // Scale up the plane to fill the screen
            const scaleMultiplier = 1 + smoothFinal * 2.5; // Scale up to 3.5x
            this.geometry.getEarthMesh().scale.setScalar(scaleMultiplier);
        }
        
        // Apply camera position
        this.camera.position.set(0, 0, cameraZ);
    }

    /**
     * Update the scene
     */
    update() {
        if (!this.geometry.getEarthMesh()) return;
        
        // Update mouse controller
        this.mouseController.update();
        
        // Handle natural Earth rotation vs morphing animation
        const shouldRotate = !this.isScrolling && (!this.hasStartedMorphing || this.scrollProgress === 1);
        
        if (shouldRotate) {
            // Natural rotation when not morphing
            this.currentRotationY += this.THREE.MathUtils.degToRad(0.05);
            this.targetRotationY = this.currentRotationY;
            
            // Update cloud rotation independently
            this.cloudRotationY += this.THREE.MathUtils.degToRad(0.1);
        }
        
        // Apply base rotation only (mouse rotation disabled)
        const totalRotationY = this.currentRotationY;
        
        // Update geometry rotation
        this.geometry.updateRotation(totalRotationY, this.cloudRotationY, this.isScrolling || this.hasStartedMorphing);
        
        // Update starfield
        this.starfield.update();
        
        // Update easter eggs
        this.easterEggs.update();
    }

    /**
     * Set scrolling state
     */
    setScrolling(isScrolling) {
        this.isScrolling = isScrolling;
    }

    /**
     * Reset the scene
     */
    reset() {
        this.scrollProgress = 1;
        this.hasStartedMorphing = false;
        this.currentRotationY = 0;
        this.targetRotationY = 0;
        this.cloudRotationY = 0;
        this.isScrolling = false;
        
        // Reset lighting
        this.lighting.reset();
        
        // Reset camera
        this.camera.position.set(0, 0, 15);
        
        // Mouse rotation disabled - no reset needed
    }

    /**
     * Get scene
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get camera
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get Earth mesh
     */
    getEarthMesh() {
        return this.geometry.getEarthMesh();
    }

    /**
     * Get cloud layer
     */
    getCloudLayer() {
        return this.geometry.getCloudLayer();
    }

    /**
     * Get atmosphere
     */
    getAtmosphere() {
        return this.geometry.getAtmosphere();
    }

    /**
     * Get starfield
     */
    getStarfield() {
        return this.starfield.getStars();
    }

    /**
     * Get astronaut
     */
    getAstronaut() {
        return this.easterEggs.getAstronaut();
    }

    /**
     * Get shooting stars
     */
    getShootingStars() {
        return this.easterEggs.getShootingStars();
    }

    /**
     * Get satellites
     */
    getSatellites() {
        return this.easterEggs.getSatellites();
    }

    /**
     * Get lighting
     */
    getLighting() {
        return this.lighting;
    }

    /**
     * Get mouse controller
     */
    getMouseController() {
        return this.mouseController;
    }

    /**
     * Get scroll progress
     */
    getScrollProgress() {
        return this.scrollProgress;
    }

    /**
     * Check if morphing has started
     */
    hasMorphingStarted() {
        return this.hasStartedMorphing;
    }

    /**
     * Check if currently scrolling
     */
    isCurrentlyScrolling() {
        return this.isScrolling;
    }

    /**
     * Destroy the scene
     */
    destroy() {
        this.lighting.destroy();
        this.geometry.destroy();
        this.starfield.destroy();
        this.easterEggs.destroy();
        this.mouseController.destroy();
        
        this.isInitialized = false;
        console.log('EarthScene destroyed');
    }
}
