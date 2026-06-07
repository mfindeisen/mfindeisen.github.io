/**
 * Starfield - Handles starfield creation and animation
 */
export class Starfield {
    constructor(scene, THREE) {
        this.scene = scene;
        this.THREE = THREE;
        this.stars = null;
        this.createStarfield();
    }

    /**
     * Create starfield
     */
    createStarfield() {
        console.log('Creating starfield');
        
        const starGeometry = new this.THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Create stars at varying distances for better depth and coverage
            const radiusCategory = Math.random();
            let radius;
            if (radiusCategory < 0.3) {
                radius = 50 + Math.random() * 100; // Close stars (50-150)
            } else if (radiusCategory < 0.7) {
                radius = 150 + Math.random() * 150; // Medium stars (150-300)
            } else {
                radius = 300 + Math.random() * 200; // Far stars (300-500)
            }
            
            // Uniform distribution on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Vary brightness based on distance (farther = dimmer)
            const distanceFactor = Math.max(0.3, 1 - (radius - 50) / 450);
            const starBrightness = (0.5 + Math.random() * 0.5) * distanceFactor;
            const colorVariation = Math.random();

            if (colorVariation < 0.7) {
                // White stars
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness;
                colors[i3 + 2] = starBrightness;
            } else if (colorVariation < 0.85) {
                // Blue-white stars
                colors[i3] = starBrightness * 0.8;
                colors[i3 + 1] = starBrightness * 0.9;
                colors[i3 + 2] = starBrightness;
            } else {
                // Yellow-orange stars
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness * 0.95;
                colors[i3 + 2] = starBrightness * 0.8;
            }

            // Vary size based on distance and brightness
            const sizeVariation = 0.5 + Math.random() * 2.0;
            sizes[i] = sizeVariation * distanceFactor;
        }

        starGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1));

        const starMaterial = new this.THREE.PointsMaterial({
            vertexColors: true,
            size: 1.5,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0.9
        });

        this.stars = new this.THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);

        console.log('Starfield created with', starCount, 'stars at varying distances');
    }

    /**
     * Update starfield animation
     */
    update() {
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
            this.stars.rotation.x += 0.0001;
        }
    }

    /**
     * Set starfield visibility
     */
    setVisible(visible) {
        if (this.stars) {
            this.stars.visible = visible;
        }
    }

    /**
     * Get starfield mesh
     */
    getStars() {
        return this.stars;
    }

    /**
     * Destroy starfield
     */
    destroy() {
        if (this.stars) {
            this.scene.remove(this.stars);
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.stars = null;
        }
    }
}
