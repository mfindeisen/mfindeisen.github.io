import { Lighting } from './Lighting.js';
import { Geometry } from './Geometry.js';
import { Starfield } from './Starfield.js';
import { Astronaut } from './Astronaut.js';
import { Satellites } from './Satellites.js';
import { ShootingStars } from './ShootingStars.js';
import { MathUtils } from '../utils/MathUtils.js';

const TIME_WARP_PEAK = 8;
const TIME_WARP_RAMP_MS = 1600;
const TIME_WARP_HOLD_MS = 5500;
const TIME_WARP_BRAKE_MS = 9000;
const TIME_WARP_CHAIN = 5;
const EPOCH_DEATH_MS = 2600;
const EPOCH_REVIVE_MS = 2200;
const EPOCH_FLASH_ATTACK_MS = 160;
const EPOCH_FLASH_DECAY_MS = 640;
const EPOCH_BRAKE_DELAY_MS = 360;
const EPOCH_BRAKE_MS = 2100;
const EPOCH_VITALITY_DELAY_MS = 80;
const SUN_INTENSITY = 6;
const SUN_COLOR = 0xffffff;
const HEMI_INTENSITY = 0.06;
const HEMI_COLOR = 0x8fb3ff;
const DEAD_SUN_INTENSITY = 3.2;

type EarthEpoch = {
    mode: 'dying' | 'reviving' | 'dead';
    start: number;
    fromVitality: number;
};

export type TimeWarpResult = 'warp' | 'death' | 'revive' | 'idle';

/**
 * EarthScene - Main class for managing the 3D Earth scene
 */
export class EarthScene {
    THREE: any;
    isInitialized: boolean;
    scene: any;
    camera: any;
    lighting: any;
    geometry: any;
    starfield: any;
    astronaut!: Astronaut;
    satellites!: Satellites;
    shootingStars!: ShootingStars;
    scrollProgress: number;
    isScrolling: boolean;
    hasStartedMorphing: boolean;
    currentRotationY: number;
    targetRotationY: number;
    rotationSpeed: number;
    cloudRotationY: number;
    sunAngle: number;
    timeScale: number;
    timeWarp: { start: number; from: number } | null;
    warpChain: number;
    vitality: number;
    flash: number;
    epoch: EarthEpoch | null;
    timeScaleAtDeath: number;
    reviveFromScale: number;
    reviveFromFlash: number;
    epochLightingApplied: boolean;

    // Morphing rotation tracking fields
    _morphRotationInitialized: boolean;
    _morphStartRotationY: number;
    _morphTargetRotationY: number;
    _morphStartCloudRotationY: number;
    _morphTargetCloudRotationY: number;
    _morphStartSunAngle: number;
    _morphTargetSunAngle: number;

    constructor(THREE: any) {
        this.THREE = THREE;
        this.isInitialized = false;
        
        // Initialize fields to avoid TS type warnings
        this.scrollProgress = 0;
        this.isScrolling = false;
        this.hasStartedMorphing = false;
        this.currentRotationY = 0;
        this.targetRotationY = 0;
        this.rotationSpeed = 0;
        this.cloudRotationY = 0;
        this.sunAngle = 0;
        this.timeScale = 1;
        this.timeWarp = null;
        this.warpChain = 0;
        this.vitality = 1;
        this.flash = 0;
        this.epoch = null;
        this.timeScaleAtDeath = 1;
        this.reviveFromScale = 1;
        this.reviveFromFlash = 0;
        this.epochLightingApplied = false;
        this._morphRotationInitialized = false;
        this._morphStartRotationY = 0;
        this._morphTargetRotationY = 0;
        this._morphStartCloudRotationY = 0;
        this._morphTargetCloudRotationY = 0;
        this._morphStartSunAngle = 0;
        this._morphTargetSunAngle = 0;

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
        this.astronaut = new Astronaut(this.scene);
        this.satellites = new Satellites(this.scene);
        this.shootingStars = new ShootingStars(this.scene);
        
        // Initialize state
        this.scrollProgress = 1; // 1 = sphere, 0 = flat
        this.isScrolling = false;
        this.hasStartedMorphing = false;
        this.currentRotationY = 0;
        this.targetRotationY = 0;
        this.rotationSpeed = 0.05;
        this.cloudRotationY = 0;
        this.sunAngle = 0.2;
        this.timeScale = 1;
        this.timeWarp = null;
        this.warpChain = 0;
        this.vitality = 1;
        this.flash = 0;
        this.epoch = null;
        this.timeScaleAtDeath = 1;
        this.reviveFromScale = 1;
        this.reviveFromFlash = 0;
        this.epochLightingApplied = false;
        
        this.isInitialized = true;
        console.log('EarthScene initialized');
    }

    /**
     * Update transformation based on scroll progress
     */
    updateTransformation(progress) {
        if (!this.geometry.getEarthMesh()) return;

        // Leaving the globe restores a living Earth and breaks a warp chain
        if (progress > 0.01) {
            if (this.epoch) this.clearEpoch();
            else this.warpChain = 0;
        }
        
        // Handle rotation normalization when morphing begins
        if (progress > 0 && !this._morphRotationInitialized) {
            this._morphStartRotationY = this.currentRotationY;
            this._morphTargetRotationY = Math.round(this.currentRotationY / (Math.PI * 2)) * (Math.PI * 2);
            
            this._morphStartCloudRotationY = this.cloudRotationY;
            this._morphTargetCloudRotationY = Math.round(this.cloudRotationY / (Math.PI * 2)) * (Math.PI * 2);
            
            this._morphStartSunAngle = this.sunAngle;
            this._morphTargetSunAngle = Math.round((this.sunAngle - 0.2) / (Math.PI * 2)) * (Math.PI * 2) + 0.2;
            
            this._morphRotationInitialized = true;
        } else if (progress === 0) {
            this._morphRotationInitialized = false;
        }

        if (this._morphRotationInitialized) {
            // Animate to nearest 2*PI multiple early in the scroll (by 40% progress)
            let rotProgress = Math.min(progress * 2.5, 1.0);
            rotProgress = MathUtils.easeInOutCubic(rotProgress);
            
            this.currentRotationY = this._morphStartRotationY + (this._morphTargetRotationY - this._morphStartRotationY) * rotProgress;
            this.cloudRotationY = this._morphStartCloudRotationY + (this._morphTargetCloudRotationY - this._morphStartCloudRotationY) * rotProgress;
            this.sunAngle = this._morphStartSunAngle + (this._morphTargetSunAngle - this._morphStartSunAngle) * rotProgress;
            
            if (this.lighting && this.lighting.lights.sun) {
                this.lighting.lights.sun.position.x = Math.cos(this.sunAngle) * 50;
                this.lighting.lights.sun.position.z = Math.sin(this.sunAngle) * 50;
            }
        }
        
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
        const cubeUnfold = this.geometry.cubeUnfold;
        if (cubeUnfold?.style === 'cube-zoom') {
            this.camera.position.set(0, 0, cubeUnfold.cameraZ(progress, this.camera));
            return;
        }

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
     * Speed the globe up, hold, then ease back to normal time.
     * Pressing again restarts the sequence from the current speed.
     */
    startTimeWarp() {
        this.timeWarp = {
            start: performance.now(),
            from: this.timeScale
        };
    }

    /**
     * Five intentional warps while one is still running ends the living Earth.
     * Another intentional warp while it is dead or dying brings it back.
     * Clicks do not count and do not rewind.
     */
    noteTimeWarp(intentional: boolean): TimeWarpResult {
        if (this.epoch) {
            if (!intentional || this.epoch.mode === 'reviving') return 'idle';
            this.beginRevive();
            return 'revive';
        }

        const warpActive = this.timeWarp !== null;
        if (intentional) {
            this.warpChain = warpActive ? this.warpChain + 1 : 1;
        }

        const onGlobe = this.scrollProgress >= 0.999;
        if (intentional && this.warpChain >= TIME_WARP_CHAIN && onGlobe) {
            this.warpChain = 0;
            this.beginDeath();
            return 'death';
        }

        if (intentional && !onGlobe) this.warpChain = 1;

        this.startTimeWarp();
        return 'warp';
    }

    beginDeath() {
        this.timeScaleAtDeath = this.timeScale;
        this.timeWarp = null;
        this.epoch = {
            mode: 'dying',
            start: performance.now(),
            fromVitality: this.vitality
        };
        this.astronaut?.depart();
    }

    beginRevive() {
        this.reviveFromScale = this.timeScale;
        this.reviveFromFlash = this.flash;
        this.timeWarp = null;
        this.warpChain = 0;
        this.epoch = {
            mode: 'reviving',
            start: performance.now(),
            fromVitality: this.vitality
        };
        this.astronaut?.recall();
    }

    clearEpoch() {
        this.epoch = null;
        this.vitality = 1;
        this.flash = 0;
        this.warpChain = 0;
        this.timeWarp = null;
        this.timeScale = 1;
        this.geometry?.setEpochVisual(1, 0);
        this.restoreLights();
        this.astronaut?.release();
    }

    epochFlash(elapsed: number) {
        if (elapsed < EPOCH_FLASH_ATTACK_MS) {
            return MathUtils.easeInOutCubic(elapsed / EPOCH_FLASH_ATTACK_MS);
        }
        const fall = elapsed - EPOCH_FLASH_ATTACK_MS;
        if (fall < EPOCH_FLASH_DECAY_MS) {
            return 1 - MathUtils.easeInOutCubic(fall / EPOCH_FLASH_DECAY_MS);
        }
        return 0;
    }

    updateEpoch() {
        const epoch = this.epoch;
        if (!epoch) return;

        const elapsed = performance.now() - epoch.start;

        if (epoch.mode === 'dying') {
            const dieT = MathUtils.clamp((elapsed - EPOCH_VITALITY_DELAY_MS) / EPOCH_DEATH_MS, 0, 1);
            this.vitality = MathUtils.lerp(epoch.fromVitality, 0, MathUtils.easeInOutCubic(dieT));
            this.flash = this.epochFlash(elapsed);
            const brakeT = MathUtils.clamp((elapsed - EPOCH_BRAKE_DELAY_MS) / EPOCH_BRAKE_MS, 0, 1);
            this.timeScale = MathUtils.lerp(this.timeScaleAtDeath, 0, MathUtils.easeInOutCubic(brakeT));
            if (dieT >= 1 && brakeT >= 1 && this.flash <= 0) {
                this.vitality = 0;
                this.timeScale = 0;
                this.flash = 0;
                this.epoch = { mode: 'dead', start: performance.now(), fromVitality: 0 };
            }
        } else if (epoch.mode === 'reviving') {
            const t = MathUtils.clamp(elapsed / EPOCH_REVIVE_MS, 0, 1);
            const eased = MathUtils.easeInOutCubic(t);
            this.vitality = MathUtils.lerp(epoch.fromVitality, 1, eased);
            this.timeScale = MathUtils.lerp(this.reviveFromScale, 1, eased);
            const flashT = MathUtils.clamp(elapsed / 420, 0, 1);
            this.flash = this.reviveFromFlash * (1 - MathUtils.easeInOutCubic(flashT));
            if (t >= 1) {
                this.vitality = 1;
                this.timeScale = 1;
                this.flash = 0;
                this.epoch = null;
                this.restoreLights();
            }
        } else {
            this.vitality = 0;
            this.timeScale = 0;
            this.flash = 0;
        }

        this.geometry?.setEpochVisual(this.vitality, this.flash);
    }

    applyEpochLighting() {
        const sun = this.lighting?.lights?.sun;
        const hemi = this.lighting?.lights?.hemi;
        if (!sun || !hemi) return;

        const dead = 1 - this.vitality;
        if (dead < 0.001 && this.flash < 0.001) {
            if (this.epochLightingApplied) this.restoreLights();
            return;
        }

        this.epochLightingApplied = true;
        const warmth = dead * (1 - this.flash);
        sun.intensity = SUN_INTENSITY * this.vitality + DEAD_SUN_INTENSITY * dead + this.flash * 12;
        sun.color.setRGB(1, 1 - warmth * 0.2, 1 - warmth * 0.58);

        const skyR = 0.561 * this.vitality + 0.28 * dead;
        const skyG = 0.702 * this.vitality + 0.14 * dead;
        const skyB = this.vitality + 0.06 * dead;
        hemi.color.setRGB(
            skyR + (1 - skyR) * this.flash,
            skyG + (1 - skyG) * this.flash,
            skyB + (1 - skyB) * this.flash
        );
        hemi.intensity = HEMI_INTENSITY * this.vitality + this.flash * 1.7;
    }

    restoreLights() {
        const sun = this.lighting?.lights?.sun;
        const hemi = this.lighting?.lights?.hemi;
        if (sun) {
            sun.intensity = SUN_INTENSITY;
            sun.color.setHex(SUN_COLOR);
        }
        if (hemi) {
            hemi.intensity = HEMI_INTENSITY;
            hemi.color.setHex(HEMI_COLOR);
        }
        this.epochLightingApplied = false;
    }

    updateTimeScale() {
        const warp = this.timeWarp;
        if (!warp) {
            this.timeScale = 1;
        } else {
            const elapsed = performance.now() - warp.start;
            const rampEnd = TIME_WARP_RAMP_MS;
            const holdEnd = rampEnd + TIME_WARP_HOLD_MS;
            const brakeEnd = holdEnd + TIME_WARP_BRAKE_MS;

            if (elapsed < rampEnd) {
                const t = MathUtils.easeInOutCubic(elapsed / rampEnd);
                this.timeScale = MathUtils.lerp(warp.from, TIME_WARP_PEAK, t);
            } else if (elapsed < holdEnd) {
                this.timeScale = TIME_WARP_PEAK;
            } else if (elapsed < brakeEnd) {
                const t = (elapsed - holdEnd) / TIME_WARP_BRAKE_MS;
                this.timeScale = MathUtils.lerp(TIME_WARP_PEAK, 1, t);
            } else {
                this.timeScale = 1;
                this.timeWarp = null;
                this.warpChain = 0;
            }
        }
    }

    update() {
        if (!this.geometry.getEarthMesh()) return;

        if (this.epoch) this.updateEpoch();
        else this.updateTimeScale();

        this.astronaut.update(this.timeScale);
        this.satellites.update(this.timeScale);
        this.shootingStars.update();
        
        // Handle natural Earth rotation vs morphing animation
        const shouldRotate = !this.isScrolling && (!this.hasStartedMorphing || this.scrollProgress === 1);
        
        if (shouldRotate) {
            const scale = this.timeScale;
            // Natural rotation when not morphing
            this.currentRotationY += this.THREE.MathUtils.degToRad(0.05) * scale;
            this.targetRotationY = this.currentRotationY;
            
            // Update cloud rotation independently
            this.cloudRotationY += this.THREE.MathUtils.degToRad(0.1) * scale;
            
            // Orbit the sun for day/night cycle
            this.sunAngle += this.THREE.MathUtils.degToRad(0.06) * scale;
            if (this.lighting && this.lighting.lights.sun) {
                this.lighting.lights.sun.position.x = Math.cos(this.sunAngle) * 50;
                this.lighting.lights.sun.position.z = Math.sin(this.sunAngle) * 50;
            }
        }
        
        // Apply base rotation only (mouse rotation disabled)
        const totalRotationY = this.currentRotationY;
        
        // Update geometry rotation
        this.geometry.updateRotation(totalRotationY, this.cloudRotationY, this.isScrolling || this.hasStartedMorphing);

        if (this.lighting?.lights.sun) {
            this.camera.updateMatrixWorld();
            this.geometry.updateSunDirection(this.lighting.lights.sun.position, this.camera);
        }
        
        // Update starfield; mouse parallax only on the unscrolled start view
        this.starfield.update(this.scrollProgress === 1);

        this.applyEpochLighting();
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
        this.sunAngle = 0.2;
        this.isScrolling = false;

        this.clearEpoch();
        
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
     * Get lighting
     */
    getLighting() {
        return this.lighting;
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
        this.astronaut.destroy();
        this.satellites.destroy();
        this.shootingStars.destroy();
        
        this.isInitialized = false;
        console.log('EarthScene destroyed');
    }
}
