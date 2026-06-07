/**
 * Geometry - Handles Earth geometry creation and morphing
 */
export class Geometry {
    constructor(scene, THREE) {
        this.scene = scene;
        this.THREE = THREE;
        this.spherePlane = null;
        this.cloudLayer = null;
        this.atmosphere = null;
        this.createMorphingGeometry();
        this.createAtmosphere();
        this.createCloudLayer();
    }

    /**
     * Create morphing geometry for Earth
     */
    createMorphingGeometry() {
        const segW = 128, segH = 64;
        const planeGeom = new this.THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

        planeGeom.morphAttributes.position = [];
        planeGeom.morphAttributes.normal = [];

        const sphereFormation = [];
        const sphereNormals = [];

        const uvs = planeGeom.attributes.uv;
        const uv = new this.THREE.Vector2();
        const t = new this.THREE.Vector3();

        for (let i = 0; i < uvs.count; i++) {
            uv.fromBufferAttribute(uvs, i);

            t.setFromSphericalCoords(
                2.5,
                Math.PI * (1 - uv.y),
                Math.PI * (uv.x - 0.5) * 2
            );

            sphereFormation.push(t.x, t.y, t.z);

            const len = Math.hypot(t.x, t.y, t.z) || 1;
            sphereNormals.push(t.x / len, t.y / len, t.z / len);
        }

        planeGeom.morphAttributes.position[0] = new this.THREE.Float32BufferAttribute(sphereFormation, 3);
        planeGeom.morphAttributes.normal[0] = new this.THREE.Float32BufferAttribute(sphereNormals, 3);

        const loader = new this.THREE.TextureLoader();
        const earthTexture = loader.load(
            'textures/world.topo.bathy.200407.3x5400x2700.jpg',
            () => console.log('Earth texture loaded'),
            undefined,
            (e) => console.error('Earth texture load error', e)
        );
        earthTexture.colorSpace = this.THREE.SRGBColorSpace;
        earthTexture.minFilter = this.THREE.LinearMipmapLinearFilter;
        earthTexture.magFilter = this.THREE.LinearFilter;

        const mat = new this.THREE.MeshStandardMaterial({
            map: earthTexture,
            side: this.THREE.DoubleSide,
            metalness: 0,
            roughness: 1
        });

        this.spherePlane = new this.THREE.Mesh(planeGeom, mat);
        this.spherePlane.castShadow = false;
        this.spherePlane.receiveShadow = false;
        this.spherePlane.rotation.z = this.THREE.MathUtils.degToRad(23.5);
        this.spherePlane.morphTargetInfluences[0] = 1;
        this.spherePlane.renderOrder = 0;

        this.scene.add(this.spherePlane);
        console.log('Earth geometry created');
    }

    /**
     * Create atmosphere
     */
    createAtmosphere() {
        const atmosphereVertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize( normalMatrix * normal );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;

        const atmosphereFragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow( 0.6 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 2.0 );
                intensity = max(intensity, 0.0);
                gl_FragColor = vec4( 0.3, 0.6, 1.0, 0.4 ) * intensity;
            }
        `;

        const atmosphereGeom = new this.THREE.SphereGeometry(2.8, 32, 32);
        const atmosphereMaterial = new this.THREE.ShaderMaterial({
            vertexShader: atmosphereVertexShader,
            fragmentShader: atmosphereFragmentShader,
            side: this.THREE.BackSide,
            blending: this.THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });

        this.atmosphere = new this.THREE.Mesh(atmosphereGeom, atmosphereMaterial);
        this.atmosphere.rotation.z = this.THREE.MathUtils.degToRad(23.5);
        this.atmosphere.position.set(0, 0, 0);

        this.scene.add(this.atmosphere);
        console.log('Atmosphere created');
    }

    /**
     * Create cloud layer
     */
    createCloudLayer() {
        const segW = 128, segH = 64;
        const cloudPlaneGeom = new this.THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

        cloudPlaneGeom.morphAttributes.position = [];
        cloudPlaneGeom.morphAttributes.normal = [];

        const cloudSphereFormation = [];
        const cloudSphereNormals = [];

        const uvs = cloudPlaneGeom.attributes.uv;
        const uv = new this.THREE.Vector2();
        const t = new this.THREE.Vector3();

        for (let i = 0; i < uvs.count; i++) {
            uv.fromBufferAttribute(uvs, i);

            t.setFromSphericalCoords(
                2.52,
                Math.PI * (1 - uv.y),
                Math.PI * (uv.x - 0.5) * 2
            );

            cloudSphereFormation.push(t.x, t.y, t.z);

            const len = Math.hypot(t.x, t.y, t.z) || 1;
            cloudSphereNormals.push(t.x / len, t.y / len, t.z / len);
        }

        cloudPlaneGeom.morphAttributes.position[0] = new this.THREE.Float32BufferAttribute(cloudSphereFormation, 3);
        cloudPlaneGeom.morphAttributes.normal[0] = new this.THREE.Float32BufferAttribute(cloudSphereNormals, 3);

        const loader = new this.THREE.TextureLoader();
        const cloudTexture = loader.load(
            'textures/Clouds.png',
            () => console.log('Cloud texture loaded'),
            undefined,
            (e) => console.error('Cloud texture load error', e)
        );
        cloudTexture.colorSpace = this.THREE.SRGBColorSpace;
        cloudTexture.minFilter = this.THREE.LinearMipmapLinearFilter;
        cloudTexture.magFilter = this.THREE.LinearFilter;

        const cloudMaterial = new this.THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.6,
            side: this.THREE.DoubleSide,
            metalness: 0,
            roughness: 1.0,
            alphaTest: 0.05,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        this.cloudLayer = new this.THREE.Mesh(cloudPlaneGeom, cloudMaterial);
        this.cloudLayer.rotation.z = this.THREE.MathUtils.degToRad(23.5);
        this.cloudLayer.position.set(0, 0, 0.02);
        this.cloudLayer.renderOrder = 1;
        this.cloudLayer.morphTargetInfluences[0] = 1;

        this.scene.add(this.cloudLayer);
        console.log('Cloud layer created');
    }

    /**
     * Update transformation based on progress
     */
    updateTransformation(progress) {
        if (!this.spherePlane) return;

        // Convert progress to scrollProgress
        const scrollProgress = 1 - progress;
        this.spherePlane.morphTargetInfluences[0] = scrollProgress;

        // Update cloud layer
        if (this.cloudLayer?.morphTargetInfluences) {
            this.cloudLayer.morphTargetInfluences[0] = scrollProgress;
            this.updateCloudLayerScaling(progress);
        }

        // Update atmosphere visibility
        if (this.atmosphere) {
            this.atmosphere.visible = progress === 0;
        }

        // Update tilt
        this.updateTilt(progress);
    }

    /**
     * Update cloud layer scaling during transformation
     */
    updateCloudLayerScaling(progress) {
        const earthScale = this.spherePlane.scale.x;

        if (progress > 0) {
            const cloudScale = (2.5 * earthScale * 1.02) / 2.52;
            this.cloudLayer.scale.setScalar(cloudScale);

            let cloudZOffset = 0.02 + (progress * 0.01);

            if (progress > 0.9) {
                const flythroughProgress = (progress - 0.9) / 0.1;
                const flythroughMultiplier = 1 + (flythroughProgress * 25);
                cloudZOffset += (flythroughProgress * flythroughMultiplier * 2.5);

                const flythroughScale = 1 + (flythroughProgress * 1.2);
                const enhancedCloudScale = cloudScale * flythroughScale;
                this.cloudLayer.scale.setScalar(enhancedCloudScale);

                const fadeStart = 0.4;
                if (progress > 0.9 + (fadeStart * 0.1)) {
                    const fadeProgress = (progress - (0.9 + fadeStart * 0.1)) / (0.1 * (1 - fadeStart));
                    const fadeOpacity = Math.max(0, 0.6 * (1 - fadeProgress));
                    this.cloudLayer.material.opacity = fadeOpacity;
                } else {
                    this.cloudLayer.material.opacity = 0.6;
                }
            } else {
                this.cloudLayer.material.opacity = 0.6;
            }

            this.cloudLayer.position.z = cloudZOffset;
        } else {
            this.cloudLayer.scale.setScalar(earthScale);
            this.cloudLayer.position.z = 0.02;
        }
    }

    /**
     * Update tilt during transformation
     */
    updateTilt(progress) {
        const scrollProgress = 1 - progress;
        let targetTilt = scrollProgress * this.THREE.MathUtils.degToRad(23.5);

        if (progress > 0.85) {
            targetTilt = 0;
            this.spherePlane.rotation.y = 0;
        }

        this.spherePlane.rotation.z = targetTilt;

        if (this.atmosphere) {
            this.atmosphere.rotation.z = targetTilt;
        }

        if (this.cloudLayer) {
            this.cloudLayer.rotation.z = targetTilt;
        }
    }

    /**
     * Update rotation
     */
    updateRotation(rotationY, cloudRotationY, isTransforming) {
        this.spherePlane.rotation.y = rotationY;

        if (this.atmosphere) {
            this.atmosphere.rotation.y = rotationY;
        }

        if (this.cloudLayer) {
            if (isTransforming) {
                this.cloudLayer.rotation.y = rotationY;
            } else {
                this.cloudLayer.rotation.y = cloudRotationY;
            }
        }
    }

    /**
     * Get Earth mesh
     */
    getEarthMesh() {
        return this.spherePlane;
    }

    /**
     * Get cloud layer
     */
    getCloudLayer() {
        return this.cloudLayer;
    }

    /**
     * Get atmosphere
     */
    getAtmosphere() {
        return this.atmosphere;
    }

    /**
     * Destroy geometry
     */
    destroy() {
        if (this.spherePlane) {
            this.scene.remove(this.spherePlane);
            this.spherePlane.geometry.dispose();
            this.spherePlane.material.dispose();
        }

        if (this.cloudLayer) {
            this.scene.remove(this.cloudLayer);
            this.cloudLayer.geometry.dispose();
            this.cloudLayer.material.dispose();
        }

        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
    }
}
