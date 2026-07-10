import { getIcon } from '../utils/Icons.js';

export class EasterEggManager {
    app: any;
    timeWarpActive: boolean;
    colorModeIndex: number;
    colorModes: any[];
    originalAstronautSpeed: number;
    originalSatelliteSpeeds: number[];
    closeHelp: (() => void) | null;

    constructor(app: any) {
        this.app = app;

        // Initialize easter egg state
        this.timeWarpActive = false;
        this.colorModeIndex = 0;
        this.colorModes = [
            { name: 'Normal', filter: '' },
            { name: 'Retro', filter: 'sepia(0.8) saturate(1.5) hue-rotate(20deg)' },
            { name: 'Cyberpunk', filter: 'hue-rotate(200deg) saturate(2) contrast(1.2)' },
            { name: 'Matrix', filter: 'hue-rotate(90deg) saturate(2) brightness(0.8)' },
            { name: 'Warm', filter: 'hue-rotate(-20deg) saturate(1.3) brightness(1.1)' }
        ];
        
        this.originalAstronautSpeed = 0;
        this.originalSatelliteSpeeds = [];
        this.closeHelp = null;
    }

    setup() {
        // Keyboard shortcuts for fun features
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in an input
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            switch (e.code) {
                case 'KeyA':
                    // 'A' for Astronaut speed boost
                    if (this.app.earthScene.astronaut) {
                        this.app.earthScene.astronautOrbitSpeed *= 2;
                        this.app.showTooltip(`${getIcon('Rocket')} Astronaut speed boost!`, 2000);
                        setTimeout(() => {
                            this.app.earthScene.astronautOrbitSpeed /= 2; // Reset after 5 seconds
                        }, 5000);
                    }
                    break;

                case 'KeyS':
                    // 'S' for Shooting star shower
                    this.triggerShootingStarShower();
                    break;

                case 'KeyT':
                    // 'T' for Time warp (speed up everything)
                    this.toggleTimeWarp();
                    break;

                case 'KeyC':
                    // 'C' for Color mode
                    this.toggleColorMode();
                    break;

                case 'KeyF':
                    // 'F' for Fireworks
                    this.triggerFireworks();
                    break;

                case 'KeyH':
                    // 'H' for Help/shortcuts
                    this.showShortcutsHelp();
                    break;
            }
        });

        // Click interactions on the canvas
        this.app.renderer.domElement.addEventListener('click', (e) => {
            this.onCanvasClick(e);
        });
    }

    onCanvasClick(e) {
        // Get click position in normalized coordinates
        const rect = this.app.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Create a ripple effect at click position
        this.createClickRipple(x, y);

        // Random chance for special effects on click
        if (Math.random() < 0.33) { // 33% chance
            const effects = ['sparkles', 'colorBurst', 'miniStar'];
            const effect = effects[Math.floor(Math.random() * effects.length)];
            this.triggerClickEffect(effect, x, y);
        }
    }

    createClickRipple(x, y) {
        // Create a visual ripple effect at the click location
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

        // Add CSS animation if not already added
        if (!document.querySelector('#ripple-styles')) {

        }

        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    triggerClickEffect(effect, x, y) {
        switch (effect) {
            case 'sparkles':
                this.createSparkles(x, y);
                break;
            case 'colorBurst':
                this.createColorBurst(x, y);
                break;
            case 'miniStar':
                this.createMiniStar(x, y);
                break;
        }
    }

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
            setTimeout(() => sparkle.remove(), 1500);
        }
        this.app.showTooltip(`${getIcon('Sparkles')} Sparkles!`, 1500);
    }

    createColorBurst(x, y) {
        // Change the whole scene color temporarily
        const canvas = this.app.renderer.domElement;
        const originalFilter = canvas.style.filter;
        canvas.style.filter = `hue-rotate(${Math.random() * 360}deg) saturate(2)`;

        setTimeout(() => {
            canvas.style.filter = originalFilter;
        }, 500);

        this.app.showTooltip(`${getIcon('Rainbow')} Color burst!`, 1500);
    }

    createMiniStar(x, y) {
        // Add a temporary star to the 3D scene at the click location
        if (this.app.earthScene.shootingStars) {
            this.app.earthScene.createShootingStar();
            this.app.showTooltip(`${getIcon('Star')} Mini shooting star!`, 2000);
        }
    }

    triggerShootingStarShower() {
        if (this.app.earthScene.shootingStars) {
            // Create multiple shooting stars rapidly
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.app.earthScene.createShootingStar();
                }, i * 200);
            }
            this.app.showTooltip(`${getIcon('Sparkles')} Shooting star shower!`, 3000);
        }
    }

    toggleTimeWarp() {
        this.timeWarpActive = !this.timeWarpActive;

        if (this.timeWarpActive) {
            // Speed up all animations
            if (this.app.earthScene.astronaut) {
                this.originalAstronautSpeed = this.app.earthScene.astronautOrbitSpeed;
                this.app.earthScene.astronautOrbitSpeed *= 3;
            }
            if (this.app.earthScene.satellites) {
                this.originalSatelliteSpeeds = this.app.earthScene.satellites.map(sat => sat.orbitSpeed);
                this.app.earthScene.satellites.forEach(sat => sat.orbitSpeed *= 3);
            }
            this.app.showTooltip(`${getIcon('Zap')} Time warp activated!`, 2000);
        } else {
            // Reset speeds
            if (this.app.earthScene.astronaut && this.originalAstronautSpeed) {
                this.app.earthScene.astronautOrbitSpeed = this.originalAstronautSpeed;
            }
            if (this.app.earthScene.satellites && this.originalSatelliteSpeeds) {
                this.app.earthScene.satellites.forEach((sat, i) => {
                    sat.orbitSpeed = this.originalSatelliteSpeeds[i];
                });
            }
            this.app.showTooltip(`${getIcon('Clock')} Time warp deactivated`, 2000);
        }
    }

    toggleColorMode() {
        this.colorModeIndex = (this.colorModeIndex + 1) % this.colorModes.length;
        const mode = this.colorModes[this.colorModeIndex];

        const canvas = this.app.renderer.domElement;
        canvas.style.filter = mode.filter;

        this.app.showTooltip(`${getIcon('Palette')} Color mode: ${mode.name}`, 2000);
    }

    triggerFireworks() {
        // Create a fireworks effect using particles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const x = (Math.random() - 0.5) * 2;
                const y = (Math.random() - 0.5) * 2;
                this.createFirework(x, y);
            }, i * 500);
        }
        this.app.showTooltip(`${getIcon('Sparkles')} Fireworks!`, 3000);
    }

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

            setTimeout(() => {
                particle.style.transform = `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`;
                particle.style.opacity = '0';
            }, 10);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    showShortcutsHelp() {
        if (this.closeHelp) {
            this.closeHelp();
            return;
        }

        const helpDiv = document.createElement('div');
        helpDiv.style.position = 'fixed';
        helpDiv.style.top = '50%';
        helpDiv.style.left = '50%';
        helpDiv.style.transform = 'translate(-50%, -50%)';
        helpDiv.style.background = 'rgba(0, 0, 0, 0.95)';
        helpDiv.style.color = 'white';
        helpDiv.style.padding = '30px';
        helpDiv.style.borderRadius = '15px';
        helpDiv.style.zIndex = '1002';
        helpDiv.style.fontSize = '15px';
        helpDiv.style.lineHeight = '1.6';
        helpDiv.style.textAlign = 'center';
        helpDiv.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
        helpDiv.style.backdropFilter = 'blur(10px)';
        helpDiv.style.border = '1px solid rgba(255, 255, 255, 0.15)';
        helpDiv.style.minWidth = '280px';
        
        helpDiv.innerHTML = `
            <div style="font-weight: 600; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                ${getIcon('Gamepad')} <span>Easter Egg Controls</span>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0 0 15px 0; text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">A</kbd>
                    <span>Astronaut speed boost</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Rocket')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">S</kbd>
                    <span>Shooting star shower</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Star')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">T</kbd>
                    <span>Toggle time warp</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Zap')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">C</kbd>
                    <span>Change color mode</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Palette')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">F</kbd>
                    <span>Fireworks show</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Sparkles')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">H</kbd>
                    <span>Show this help</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Help')}</span>
                </li>
            </ul>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 10px;">
                ${getIcon('Mouse')} <span>Click anywhere for surprises!</span>
            </div>
        `;

        this.closeHelp = () => {
            if (helpDiv.parentNode) {
                helpDiv.remove();
            }
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('keydown', keyHandler);
            this.closeHelp = null;
        };

        const clickHandler = () => {
            this.closeHelp();
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeHelp();
            }
        };

        // Delay attaching listeners to prevent immediate triggering
        setTimeout(() => {
            if (this.closeHelp) {
                document.addEventListener('click', clickHandler);
                document.addEventListener('keydown', keyHandler);
            }
        }, 10);

        document.body.appendChild(helpDiv);

        // Auto-close after 8 seconds
        setTimeout(() => {
            if (this.closeHelp) {
                this.closeHelp();
            }
        }, 8000);
    }
}
