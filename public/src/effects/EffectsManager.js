/**
 * EffectsManager - Handles visual effects and animations
 */
export class EffectsManager {
    constructor() {
        this.activeEffects = new Set();
        this.timeWarpActive = false;
        this.colorModeIndex = 0;
        this.colorModes = [
            { name: 'Normal', filter: '' },
            { name: 'Retro', filter: 'sepia(0.8) saturate(1.5) hue-rotate(20deg)' },
            { name: 'Cyberpunk', filter: 'hue-rotate(200deg) saturate(2) contrast(1.2)' },
            { name: 'Matrix', filter: 'hue-rotate(90deg) saturate(2) brightness(0.8)' },
            { name: 'Warm', filter: 'hue-rotate(-20deg) saturate(1.3) brightness(1.1)' }
        ];
    }

    /**
     * Create click ripple effect
     */
    createClickRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = `${(x + 1) * 50}%`;
        ripple.style.top = `${(-y + 1) * 50}%`;
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '1000';
        ripple.style.animation = 'rippleEffect 1s ease-out forwards';
        
        this.addRippleStyles();
        document.body.appendChild(ripple);
        this.activeEffects.add(ripple);
        
        setTimeout(() => {
            this.removeEffect(ripple);
        }, 1000);
    }

    /**
     * Create sparkles effect
     */
    createSparkles(x, y) {
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'fixed';
            sparkle.style.left = `${(x + 1) * 50 + (Math.random() - 0.5) * 20}%`;
            sparkle.style.top = `${(-y + 1) * 50 + (Math.random() - 0.5) * 20}%`;
            sparkle.style.width = '6px';
            sparkle.style.height = '6px';
            sparkle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
            sparkle.style.borderRadius = '50%';
            sparkle.style.transform = 'translate(-50%, -50%)';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1000';
            sparkle.style.animation = 'sparkleEffect 1.5s ease-out forwards';
            
            document.body.appendChild(sparkle);
            this.activeEffects.add(sparkle);
            
            setTimeout(() => {
                this.removeEffect(sparkle);
            }, 1500);
        }
    }

    /**
     * Create color burst effect
     */
    createColorBurst(x, y, canvas) {
        const originalFilter = canvas.style.filter;
        canvas.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(2)`;
        
        setTimeout(() => {
            canvas.style.filter = originalFilter;
        }, 500);
    }

    /**
     * Create fireworks effect
     */
    createFireworks(count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = (Math.random() - 0.5) * 2;
                const y = (Math.random() - 0.5) * 2;
                this.createFirework(x, y);
            }, i * 500);
        }
    }

    /**
     * Create individual firework
     */
    createFirework(x, y) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i / 12) * Math.PI * 2;
            const velocity = 3 + Math.random() * 2;
            
            particle.style.position = 'fixed';
            particle.style.left = `${(x + 1) * 50}%`;
            particle.style.top = `${(-y + 1) * 50}%`;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            const endX = Math.cos(angle) * velocity * 50;
            const endY = Math.sin(angle) * velocity * 50;
            
            particle.style.transition = 'all 1s ease-out';
            document.body.appendChild(particle);
            this.activeEffects.add(particle);
            
            setTimeout(() => {
                particle.style.transform = `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`;
                particle.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                this.removeEffect(particle);
            }, 1000);
        }
    }

    /**
     * Toggle time warp effect
     */
    toggleTimeWarp(earthScene) {
        this.timeWarpActive = !this.timeWarpActive;
        
        if (this.timeWarpActive) {
            // Speed up all animations
            if (earthScene.astronaut) {
                this.originalAstronautSpeed = earthScene.astronautOrbitSpeed;
                earthScene.astronautOrbitSpeed *= 3;
            }
            if (earthScene.satellites) {
                this.originalSatelliteSpeeds = earthScene.satellites.map(sat => sat.orbitSpeed);
                earthScene.satellites.forEach(sat => sat.orbitSpeed *= 3);
            }
        } else {
            // Reset speeds
            if (earthScene.astronaut && this.originalAstronautSpeed) {
                earthScene.astronautOrbitSpeed = this.originalAstronautSpeed;
            }
            if (earthScene.satellites && this.originalSatelliteSpeeds) {
                earthScene.satellites.forEach((sat, i) => {
                    sat.orbitSpeed = this.originalSatelliteSpeeds[i];
                });
            }
        }
        
        return this.timeWarpActive;
    }

    /**
     * Toggle color mode
     */
    toggleColorMode(canvas) {
        this.colorModeIndex = (this.colorModeIndex + 1) % this.colorModes.length;
        const mode = this.colorModes[this.colorModeIndex];
        
        canvas.style.filter = mode.filter;
        return mode.name;
    }

    /**
     * Remove a specific effect
     */
    removeEffect(effect) {
        if (effect && effect.parentNode) {
            effect.remove();
            this.activeEffects.delete(effect);
        }
    }

    /**
     * Remove all active effects
     */
    removeAllEffects() {
        this.activeEffects.forEach(effect => {
            if (effect && effect.parentNode) {
                effect.remove();
            }
        });
        this.activeEffects.clear();
    }

    /**
     * Add ripple effect styles
     */
    addRippleStyles() {
        if (document.querySelector('#ripple-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes rippleEffect {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -50%) scale(8);
                    opacity: 0;
                }
            }
            
            @keyframes sparkleEffect {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                50% { transform: scale(1) rotate(180deg); opacity: 1; }
                100% { transform: scale(0) rotate(360deg); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Cleanup all effects
     */
    destroy() {
        this.removeAllEffects();
    }
}
