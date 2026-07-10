/**
 * Lighting - Handles all lighting setup and management for the Earth scene
 */
export class Lighting {
    scene: any;
    THREE: any;
    lights: { [key: string]: any };

    constructor(scene: any, THREE: any) {
        this.scene = scene;
        this.THREE = THREE;
        this.lights = {};
        this.setupLighting();
    }

    /**
     * Setup all lighting for the scene
     */
    setupLighting() {
        // Hemisphere light for natural sky/ground ambient
        const hemi = new this.THREE.HemisphereLight(0x8fb3ff, 0x0b0b1a, 0.06);
        this.scene.add(hemi);
        this.lights.hemi = hemi;

        // Additional ambient light for flat plane visibility
        const ambient = new this.THREE.AmbientLight(0x404040, 0.0);
        this.scene.add(ambient);
        this.lights.ambient = ambient;

        // Sun from the right/front a bit above
        const sun = new this.THREE.DirectionalLight(0xffffff, 6.0);
        sun.position.set(50, 5, 10);
        sun.target.position.set(0, 0, 0);
        this.scene.add(sun);
        this.scene.add(sun.target);
        this.lights.sun = sun;

        console.log('Lighting setup complete');
    }

    /**
     * Update lighting during transformation
     */
    updateTransformation(progress) {
        const t = progress; // 0 = sphere, 1 = flat
        
        if (this.lights.hemi) {
            const hemiIntensity = 0.06 + t * 0.4;
            this.lights.hemi.intensity = hemiIntensity;
        }
        
        if (this.lights.ambient) {
            const ambientIntensity = t * 0.6;
            this.lights.ambient.intensity = ambientIntensity;
        }
    }

    /**
     * Reset lighting to original values
     */
    reset() {
        if (this.lights.hemi) {
            this.lights.hemi.intensity = 0.06;
        }
        if (this.lights.ambient) {
            this.lights.ambient.intensity = 0.0;
        }
    }

    /**
     * Get a specific light
     */
    getLight(name) {
        return this.lights[name];
    }

    /**
     * Get all lights
     */
    getAllLights() {
        return this.lights;
    }

    /**
     * Set light intensity
     */
    setLightIntensity(lightName, intensity) {
        if (this.lights[lightName]) {
            this.lights[lightName].intensity = intensity;
        }
    }

    /**
     * Set light color
     */
    setLightColor(lightName, color) {
        if (this.lights[lightName]) {
            this.lights[lightName].color.setHex(color);
        }
    }

    /**
     * Set light position
     */
    setLightPosition(lightName, x, y, z) {
        if (this.lights[lightName]) {
            this.lights[lightName].position.set(x, y, z);
        }
    }

    /**
     * Remove all lights from scene
     */
    destroy() {
        Object.values(this.lights).forEach((light: any) => {
            if (light.target) {
                this.scene.remove(light.target);
            }
            this.scene.remove(light);
        });
        this.lights = {};
    }
}
