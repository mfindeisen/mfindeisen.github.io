import { getIcon } from '../utils/Icons.js';
import { getMorphStyle, type MorphStyle } from '../earth/CubeUnfold.js';
import { t } from '../i18n/i18n.js';

type ColorOp =
    | { op: 'sepia'; amount: number }
    | { op: 'saturate'; amount: number }
    | { op: 'hue'; degrees: number }
    | { op: 'contrast'; amount: number }
    | { op: 'brightness'; amount: number };

type ColorGrade = { m: number[]; o: number[] };

function identityGrade(): ColorGrade {
    return { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], o: [0, 0, 0] };
}

function multiplyGrade(a: ColorGrade, b: ColorGrade): ColorGrade {
    const A = a.m;
    const B = b.m;
    const m: number[] = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            m.push(A[row * 3] * B[col] + A[row * 3 + 1] * B[3 + col] + A[row * 3 + 2] * B[6 + col]);
        }
    }
    const o = [0, 0, 0];
    for (let row = 0; row < 3; row++) {
        o[row] = A[row * 3] * b.o[0] + A[row * 3 + 1] * b.o[1] + A[row * 3 + 2] * b.o[2] + a.o[row];
    }
    return { m, o };
}

function colorOpGrade(op: ColorOp): ColorGrade {
    if (op.op === 'brightness') {
        const v = op.amount;
        return { m: [v, 0, 0, 0, v, 0, 0, 0, v], o: [0, 0, 0] };
    }
    if (op.op === 'contrast') {
        const v = op.amount;
        const bias = 0.5 * (1 - v);
        return { m: [v, 0, 0, 0, v, 0, 0, 0, v], o: [bias, bias, bias] };
    }
    if (op.op === 'saturate') {
        const s = op.amount;
        const r = 0.213;
        const g = 0.715;
        const b = 0.072;
        return {
            m: [
                r + (1 - r) * s, g * (1 - s), b * (1 - s),
                r * (1 - s), g + (1 - g) * s, b * (1 - s),
                r * (1 - s), g * (1 - s), b + (1 - b) * s
            ],
            o: [0, 0, 0]
        };
    }
    if (op.op === 'sepia') {
        const amount = op.amount;
        const keep = 1 - amount;
        const sepia = [
            0.393, 0.769, 0.189,
            0.349, 0.686, 0.168,
            0.272, 0.534, 0.131
        ];
        const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        return { m: sepia.map((value, i) => keep * identity[i] + amount * value), o: [0, 0, 0] };
    }

    const rad = op.degrees * Math.PI / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return {
        m: [
            0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
            0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
            0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
        ],
        o: [0, 0, 0]
    };
}

function composeColorGrade(ops: ColorOp[]): ColorGrade {
    return ops.reduce((grade, op) => multiplyGrade(colorOpGrade(op), grade), identityGrade());
}

export class EasterEggManager {
    app: any;
    colorModeIndex: number;
    colorModes: any[];
    astronautBoostTimer: ReturnType<typeof setTimeout> | undefined;
    helpAutoCloseTimer: ReturnType<typeof setTimeout> | undefined;
    closeHelp: (() => void) | null;

    constructor(app: any) {
        this.app = app;

        // Initialize easter egg state
        this.colorModeIndex = 0;
        this.colorModes = [
            { name: 'Normal', filters: [] },
            { name: 'Retro', filters: [{ op: 'sepia', amount: 0.8 }, { op: 'saturate', amount: 1.5 }, { op: 'hue', degrees: 20 }] },
            { name: 'Cyberpunk', filters: [{ op: 'hue', degrees: 200 }, { op: 'saturate', amount: 2 }, { op: 'contrast', amount: 1.2 }] },
            { name: 'Matrix', filters: [{ op: 'hue', degrees: 90 }, { op: 'saturate', amount: 2 }, { op: 'brightness', amount: 0.8 }] },
            { name: 'Warm', filters: [{ op: 'hue', degrees: -20 }, { op: 'saturate', amount: 1.3 }, { op: 'brightness', amount: 1.1 }] }
        ];

        this.closeHelp = null;
    }

    setup() {
        this.app.renderer.domElement.style.filter = '';

        // Keyboard shortcuts for fun features
        document.addEventListener('keydown', (e) => {
            // Only trigger if not typing in an input
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            if (e.code === 'KeyH') {
                this.showShortcutsHelp();
                return;
            }

            // Key repeat would finish the warp chain by holding T
            if (e.code === 'KeyT') {
                if (!e.repeat) this.triggerTimeWarp(true);
                return;
            }

            const effect = this.surpriseEffects.find((item) => item.key === e.code);
            effect?.run();
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

        // Same effects as the keyboard shortcuts, picked at random
        if (Math.random() < 0.33) {
            const effects = this.surpriseEffects;
            effects[Math.floor(Math.random() * effects.length)].run();
        }
    }

    get surpriseEffects() {
        return [
            { key: 'KeyA', run: () => this.boostAstronaut() },
            { key: 'KeyS', run: () => this.triggerShootingStarShower() },
            { key: 'KeyT', run: () => this.triggerTimeWarp() },
            { key: 'KeyC', run: () => this.toggleColorMode() },
            { key: 'KeyF', run: () => this.triggerFireworks() },
        ];
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

    get easterEggs() {
        return this.app.earthScene?.easterEggs;
    }

    boostAstronaut() {
        const eggs = this.easterEggs;
        if (!eggs) return;

        eggs.summonAstronaut();
        eggs.astronautBoost = 3;
        clearTimeout(this.astronautBoostTimer);
        this.astronautBoostTimer = setTimeout(() => {
            eggs.astronautBoost = 1;
        }, 5000);
        this.app.showTooltip(`${getIcon('Rocket')} ${t('eggs.astronaut')}`, 2000);
    }

    triggerShootingStarShower() {
        const eggs = this.easterEggs;
        if (!eggs) return;

        for (let i = 0; i < 8; i++) {
            setTimeout(() => eggs.createShootingStar(), i * 200);
        }
        this.app.showTooltip(`${getIcon('Star')} ${t('eggs.stars')}`, 3000);
    }

    triggerTimeWarp(intentional = false) {
        const scene = this.app.earthScene;
        if (!scene?.noteTimeWarp) return;

        const result = scene.noteTimeWarp(intentional);
        if (result === 'death') {
            this.app.showTooltip(`${getIcon('Zap')} ${t('eggs.oceansGone')}`, 3200);
            return;
        }
        if (result === 'revive') {
            this.app.showTooltip(`${getIcon('Zap')} ${t('eggs.oceansReturn')}`, 2600);
            return;
        }
        if (result !== 'warp') return;

        this.easterEggs?.summonAstronaut();
        this.app.showTooltip(`${getIcon('Zap')} ${t('eggs.timeWarp')}`, 2000);
    }

    toggleColorMode() {
        this.colorModeIndex = (this.colorModeIndex + 1) % this.colorModes.length;
        const mode = this.colorModes[this.colorModeIndex];
        const grade = composeColorGrade(mode.filters);

        this.app.renderer.domElement.style.filter = '';
        this.app.earthScene?.geometry?.setColorGrade(grade.m, grade.o);
        this.app.showTooltip(`${getIcon('Palette')} ${t('eggs.colorMode', { mode: mode.name })}`, 2000);
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
        this.app.showTooltip(`${getIcon('Fire')} ${t('eggs.fireworks')}`, 3000);
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

    renderMorphStyleLinks() {
        const current = getMorphStyle();
        const styles: { id: MorphStyle; label: string }[] = [
            { id: 'cube-zoom', label: t('eggs.morphCubeZoom') },
            { id: 'cube-fade', label: t('eggs.morphCubeFade') },
            { id: 'classic', label: t('eggs.morphClassic') }
        ];

        return styles.map(({ id, label }) => {
            const url = new URL(window.location.href);
            if (id === 'cube-zoom') {
                url.searchParams.delete('morph');
            } else {
                url.searchParams.set('morph', id);
            }
            const active = id === current;
            return `
                <a href="${url.pathname}${url.search}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; text-decoration: none; color: ${active ? '#fff' : 'rgba(255, 255, 255, 0.75)'}; background: ${active ? 'rgba(90, 169, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)'}; border: 1px solid ${active ? 'rgba(90, 169, 255, 0.6)' : 'transparent'};">
                    <span>${label}</span>
                    ${active ? '<span style="margin-left: auto; font-size: 12px; color: #5aa9ff;">active</span>' : ''}
                </a>`;
        }).join('');
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
                ${getIcon('Gamepad')} <span>${t('eggs.helpTitle')}</span>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0 0 15px 0; text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">A</kbd>
                    <span>${t('eggs.helpAstronaut')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Rocket')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">S</kbd>
                    <span>${t('eggs.helpStars')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Star')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">T</kbd>
                    <span>${t('eggs.helpTime')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Zap')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">C</kbd>
                    <span>${t('eggs.helpColor')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Palette')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">F</kbd>
                    <span>${t('eggs.helpFireworks')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Fire')}</span>
                </li>
                <li style="display: flex; align-items: center; gap: 10px;">
                    <kbd style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; border-bottom: 2px solid rgba(255, 255, 255, 0.4);">H</kbd>
                    <span>${t('eggs.helpHelp')}</span>
                    <span style="margin-left: auto; display: flex; align-items: center;">${getIcon('Help')}</span>
                </li>
            </ul>
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px; margin-bottom: 12px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 8px;">
                    ${getIcon('Globe')} <span>${t('eggs.morphTitle')}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${this.renderMorphStyleLinks()}
                </div>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 10px;">
                ${getIcon('Mouse')} <span>${t('eggs.clickSurprises')}</span>
            </div>
        `;

        this.closeHelp = () => {
            clearTimeout(this.helpAutoCloseTimer);
            if (helpDiv.parentNode) {
                helpDiv.remove();
            }
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('keydown', keyHandler);
            this.closeHelp = null;
        };

        const clickHandler = () => {
            this.closeHelp?.();
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeHelp?.();
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

        this.helpAutoCloseTimer = setTimeout(() => {
            this.closeHelp?.();
        }, 12000);
    }
}
