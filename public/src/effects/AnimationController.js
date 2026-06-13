/**
 * AnimationController - Handles scroll-based animations and transformations
 */
export class AnimationController {
    constructor(THREE) {
        this.THREE = THREE;
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.hasStartedMorphing = false;
    }

    /**
     * Handle scroll event and update animations
     */
    handleScroll(event, earthScene, uiManager) {
        // Don't prevent default - let the page scroll naturally
        // The onScroll event will handle the transformation updates
        
        // Mark that user has started morphing
        this.hasStartedMorphing = true;
        
        // Set scrolling flag to pause rotation
        this.isScrolling = true;
        
        // Clear existing timeout
        clearTimeout(this.scrollTimeout);
        
        // End scrolling state after 1 second
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
            this.resetLighting(earthScene);
        }, 1000);
    }

    /**
     * Update earth transformation based on scroll progress
     */
    updateTransformation(earthScene, progress) {
        if (!earthScene.spherePlane) return;
        
        // Convert progress (0-1 where 1 is fully morphed) to scrollProgress (1-0 where 1 is sphere)
        earthScene.scrollProgress = 1 - progress;
        earthScene.spherePlane.morphTargetInfluences[0] = earthScene.scrollProgress;
        
        // Update cloud layer morphing
        this.updateCloudLayer(earthScene, progress);
        
        // Update atmosphere visibility
        this.updateAtmosphere(earthScene, progress);
        
        // Update lighting during morph
        this.updateLighting(earthScene, progress);
        
        // Update tilt
        this.updateTilt(earthScene, progress);
        
        // Handle final zoom phase
        this.handleFinalZoom(earthScene, progress);
        
        // Track if user has started morphing
        if (progress > 0) {
            earthScene.hasStartedMorphing = true;
        }
    }

    /**
     * Update cloud layer during transformation
     */
    updateCloudLayer(earthScene, progress) {
        if (!earthScene.cloudLayer?.morphTargetInfluences) return;
        
        earthScene.cloudLayer.morphTargetInfluences[0] = earthScene.scrollProgress;
        
        const earthScale = earthScene.spherePlane.scale.x;
        
        if (progress > 0) {
            // During transformation, scale cloud layer to match Earth radius
            const cloudScale = (2.5 * earthScale * 1.02) / 2.52;
            earthScene.cloudLayer.scale.setScalar(cloudScale);
            
            // Enhanced cloud positioning for flythrough effect
            let cloudZOffset = 0.02 + (progress * 0.01);
            
            // Start flythrough effect in final phase
            if (progress > 0.9) {
                const flythroughProgress = (progress - 0.9) / 0.1;
                const flythroughMultiplier = 1 + (flythroughProgress * 25);
                cloudZOffset += (flythroughProgress * flythroughMultiplier * 2.5);
                
                // Make clouds appear larger during flythrough
                const flythroughScale = 1 + (flythroughProgress * 1.2);
                const enhancedCloudScale = cloudScale * flythroughScale;
                earthScene.cloudLayer.scale.setScalar(enhancedCloudScale);
                
                // Fade out clouds as they move forward
                const fadeStart = 0.4;
                if (progress > 0.9 + (fadeStart * 0.1)) {
                    const fadeProgress = (progress - (0.9 + fadeStart * 0.1)) / (0.1 * (1 - fadeStart));
                    const fadeOpacity = Math.max(0, 0.6 * (1 - fadeProgress));
                    earthScene.cloudLayer.material.opacity = fadeOpacity;
                } else {
                    earthScene.cloudLayer.material.opacity = 0.6;
                }
            } else {
                earthScene.cloudLayer.material.opacity = 0.6;
            }
            
            earthScene.cloudLayer.position.z = cloudZOffset;
        } else {
            // When sphere, use normal scale
            earthScene.cloudLayer.scale.setScalar(earthScale);
            earthScene.cloudLayer.position.z = 0.02;
        }
    }

    /**
     * Update atmosphere visibility
     */
    updateAtmosphere(earthScene, progress) {
        if (!earthScene.atmosphere) return;
        
        // Hide atmosphere when scrolling begins, show when back to sphere
        if (progress > 0) {
            earthScene.atmosphere.visible = false;
        } else {
            earthScene.atmosphere.visible = true;
        }
        
        // Sync atmosphere rotation with Earth
        earthScene.atmosphere.rotation.y = earthScene.currentRotationY;
    }

    /**
     * Update lighting during transformation
     */
    updateLighting(earthScene, progress) {
        if (!earthScene.hemiLight || !earthScene.ambientLight) return;
        
        const t = progress; // 0 = sphere, 1 = flat
        
        // Hemisphere light: moderate increase
        const hemiIntensity = 0.06 + t * 0.4;
        earthScene.hemiLight.intensity = hemiIntensity;
        
        // Pure ambient light: strong increase for flat visibility
        const ambientIntensity = t * 0.6;
        earthScene.ambientLight.intensity = ambientIntensity;
    }

    /**
     * Reset lighting to original values
     */
    resetLighting(earthScene) {
        if (earthScene.hemiLight) {
            earthScene.hemiLight.intensity = 0.06;
        }
        if (earthScene.ambientLight) {
            earthScene.ambientLight.intensity = 0.0;
        }
    }

    /**
     * Update tilt during transformation
     */
    updateTilt(earthScene, progress) {
        // Gradually reduce tilt when morphing - completely flat when fully morphed
        let targetTilt = earthScene.scrollProgress * this.THREE.MathUtils.degToRad(23.5);
        
        // Ensure completely flat in final phase
        if (progress > 0.85) {
            targetTilt = 0;
        }
        
        earthScene.spherePlane.rotation.z = targetTilt;
        
        // Sync atmosphere and cloud layer tilt
        if (earthScene.atmosphere) {
            earthScene.atmosphere.rotation.z = targetTilt;
        }
        if (earthScene.cloudLayer) {
            earthScene.cloudLayer.rotation.z = targetTilt;
        }
    }

    /**
     * Handle final zoom phase
     */
    handleFinalZoom(earthScene, progress) {
        const easedProgress = this.easeInOutCubic(progress);
        let cameraZ = 15;
        
        if (progress < 0.85) {
            // Gradual zoom in during morphing
            cameraZ = 15 - progress * 8; // Zoom from 15 to 7
            earthScene.spherePlane.scale.setScalar(1.0);
        } else {
            // Final zoom phase with scaling for full-screen effect
            const finalProgress = (progress - 0.85) / 0.15;
            const smoothFinal = this.easeInOutCubic(finalProgress);
            
            cameraZ = 7 - smoothFinal * 4; // Final zoom (7 -> 3)
            
            // Scale up the plane to fill the screen
            const scaleMultiplier = 1 + smoothFinal * 2.5; // Scale up to 3.5x
            earthScene.spherePlane.scale.setScalar(scaleMultiplier);
        }
        
        // Apply camera position
        earthScene.camera.position.set(0, 0, cameraZ);
    }



    /**
     * Easing function for smooth animations
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    /**
     * Reset animation state
     */
    reset() {
        this.isScrolling = false;
        this.hasStartedMorphing = false;
        
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
    }

    /**
     * Check if currently scrolling
     */
    isCurrentlyScrolling() {
        return this.isScrolling;
    }

    /**
     * Check if morphing has started
     */
    hasMorphingStarted() {
        return this.hasStartedMorphing;
    }
}
