/**
 * Starfield - Handles starfield creation and animation
 */
export class Starfield {
    constructor(scene, THREE) {
        this.scene = scene;
        this.THREE = THREE;
        this.layers = [];
        this.starMaterial = null;
        this.time = 0;

        this.createStarfield();
    }

    /**
     * Create custom shader attributes for a spherical star layer
     */
    createLayerGeometry(starCount, minRadius, maxRadius, speedMin, speedMax) {
        const starGeometry = new this.THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const twinkleSpeeds = new Float32Array(starCount);
        const twinklePhases = new Float32Array(starCount);
        const twinkleAmounts = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Varying distance for natural distribution
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            
            // Uniform spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Vary brightness based on distance (farther = slightly dimmer/smaller)
            // Increased the minimum distanceFactor to keep far stars visible
            const distanceFactor = Math.max(0.55, 1 - (radius - 50) / 450);
            
            // Boosted base brightness
            const starBrightness = (0.75 + Math.random() * 0.25) * distanceFactor;
            const colorVariation = Math.random();

            // Curated astronomical star colors
            if (colorVariation < 0.65) {
                // Bright white stars
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness;
                colors[i3 + 2] = starBrightness;
            } else if (colorVariation < 0.82) {
                // Cool blue-white stars (class O/B)
                colors[i3] = starBrightness * 0.8;
                colors[i3 + 1] = starBrightness * 0.92;
                colors[i3 + 2] = starBrightness;
            } else if (colorVariation < 0.95) {
                // Warm yellow-orange stars (class G/K)
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness * 0.95;
                colors[i3 + 2] = starBrightness * 0.75;
            } else {
                // Soft reddish stars (class M)
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness * 0.65;
                colors[i3 + 2] = starBrightness * 0.55;
            }

            // Sizes (scaled up slightly for circular soft rendering to show up on screen)
            const sizeVariation = 1.6 + Math.random() * 3.4;
            sizes[i] = sizeVariation * distanceFactor;

            // Individual twinkling speed and phase parameters
            twinkleSpeeds[i] = speedMin + Math.random() * (speedMax - speedMin);
            twinklePhases[i] = Math.random() * Math.PI * 2;

            // Twinkle amount: only 0.2% of stars twinkle, 99.8% are steady
            const shouldTwinkle = Math.random() < 0.002;
            twinkleAmounts[i] = shouldTwinkle ? (0.4 + Math.random() * 0.6) : 0.0;
        }

        starGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1));
        starGeometry.setAttribute('aTwinkleSpeed', new this.THREE.BufferAttribute(twinkleSpeeds, 1));
        starGeometry.setAttribute('aTwinklePhase', new this.THREE.BufferAttribute(twinklePhases, 1));
        starGeometry.setAttribute('aTwinkleAmount', new this.THREE.BufferAttribute(twinkleAmounts, 1));

        return starGeometry;
    }

    /**
     * Create starfield
     */
    createStarfield() {
        console.log('Creating premium GPU-accelerated starfield');

        // Create unified shader material for all layers
        this.starMaterial = new this.THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 }
            },
            vertexShader: `
                uniform float uTime;
                attribute vec3 color;
                attribute float size;
                attribute float aTwinkleSpeed;
                attribute float aTwinklePhase;
                attribute float aTwinkleAmount;
                varying vec3 vColor;
                varying float vTwinkle;

                void main() {
                    vColor = color;
                    
                    // Occasional pulse: steady at 0.8, pulses to 1.0 once every period.
                    // A high exponent (24.0) ensures a quick elegant sparkle once every ~5s
                    float pulse = pow(max(0.0, sin(uTime * aTwinkleSpeed + aTwinklePhase)), 24.0);
                    float baseTwinkle = 0.8 + 0.2 * pulse;
                    
                    // Mix between steady 1.0 and twinkle value based on aTwinkleAmount
                    float twinkle = mix(1.0, baseTwinkle, aTwinkleAmount);
                    vTwinkle = twinkle;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Size scales slightly with brightness fluctuations
                    // Enforce a minimum size floor of 2.4 to ensure stable rasterization and eliminate aliasing flicker
                    gl_PointSize = max(2.4, size * (1.1 + 0.4 * twinkle));
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vTwinkle;

                void main() {
                    // Coordinates relative to center of the point
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // Smooth anti-aliased edge to 0.0 without using discard
                    // This avoids binary subpixel rasterization jumps and eliminates flickering
                    float alpha = smoothstep(0.5, 0.2, dist);
                    
                    // High-quality radial glow profile
                    float glow = smoothstep(0.5, 0.0, dist) * 0.4 + smoothstep(0.2, 0.0, dist) * 0.6;
                    
                    // Boosted brightness factor (1.6) and increased base twinkle opacity for excellent visibility
                    gl_FragColor = vec4(vColor * (vTwinkle * 0.7 + 0.3) * glow * 1.6, alpha * (vTwinkle * 0.8 + 0.2));
                }
            `,
            transparent: true,
            blending: this.THREE.AdditiveBlending,
            depthWrite: false
        });

        // Set up 3 parallax layers with 5,000 stars each
        // Close layer (50-150 radius): sparkles every ~8-12 seconds
        const geoClose = this.createLayerGeometry(5000, 50, 150, 0.5, 0.8);
        const pointsClose = new this.THREE.Points(geoClose, this.starMaterial);
        this.scene.add(pointsClose);
        this.layers.push({
            mesh: pointsClose,
            rotSpeedX: 0.000014,
            rotSpeedY: 0.000018,
            rotSpeedZ: 0.000004
        });

        // Medium layer (150-300 radius): sparkles every ~10-20 seconds
        const geoMed = this.createLayerGeometry(5000, 150, 300, 0.3, 0.6);
        const pointsMed = new this.THREE.Points(geoMed, this.starMaterial);
        this.scene.add(pointsMed);
        this.layers.push({
            mesh: pointsMed,
            rotSpeedX: 0.000007,
            rotSpeedY: 0.000009,
            rotSpeedZ: 0.000002
        });

        // Far layer (300-500 radius): sparkles every ~18-40 seconds
        const geoFar = this.createLayerGeometry(5000, 300, 500, 0.15, 0.35);
        const pointsFar = new this.THREE.Points(geoFar, this.starMaterial);
        this.scene.add(pointsFar);
        this.layers.push({
            mesh: pointsFar,
            rotSpeedX: 0.000002,
            rotSpeedY: 0.000003,
            rotSpeedZ: 0.000001
        });

        console.log('Starfield successfully created with 3 parallax layers (15,000 stars total)');
    }



    /**
     * Update starfield animation
     */
    update() {
        // Increment time based on roughly ~60fps
        this.time += 0.016;
        
        if (this.starMaterial) {
            this.starMaterial.uniforms.uTime.value = this.time;
        }

        // Animate rotation independently for each layer to create parallax depth
        this.layers.forEach(layer => {
            if (layer.mesh) {
                layer.mesh.rotation.x += layer.rotSpeedX;
                layer.mesh.rotation.y += layer.rotSpeedY;
                layer.mesh.rotation.z += layer.rotSpeedZ;
            }
        });


    }

    /**
     * Set starfield visibility
     */
    setVisible(visible) {
        this.layers.forEach(layer => {
            if (layer.mesh) {
                layer.mesh.visible = visible;
            }
        });
    }

    /**
     * Get starfield mesh (compatibility with single mesh reference)
     */
    getStars() {
        // Return first layer for basic API compatibility
        return this.layers.length > 0 ? this.layers[0].mesh : null;
    }

    /**
     * Destroy starfield
     */
    destroy() {
        this.layers.forEach(layer => {
            if (layer.mesh) {
                this.scene.remove(layer.mesh);
                layer.mesh.geometry.dispose();
            }
        });
        if (this.starMaterial) {
            this.starMaterial.dispose();
        }
        this.layers = [];
    }
}
