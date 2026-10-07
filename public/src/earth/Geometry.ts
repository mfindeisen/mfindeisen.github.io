import { CubeUnfold, getMorphStyle } from './CubeUnfold.js';
import { MathUtils } from '../utils/MathUtils.js';
import { COLOR_GRADE_APPLY_GLSL, COLOR_GRADE_GLSL, NIGHT_EMISSIVE, OCEAN_GLOSS_GLSL, SURFACE_UNIFORMS_GLSL, type SurfaceUniforms, nightLightsGlsl } from './SurfaceShader.js';

const CLOUD_OPACITY = 0.9;

// Living oceans collapse into dark basins; land shifts toward rust and ash
const DEAD_GRADE_MATRIX = [
    0.40, 0.28, 0.04,
    0.18, 0.22, 0.03,
    0.06, 0.05, 0.045
];
const DEAD_GRADE_OFFSET = [0.025, 0.01, 0.0];
const IDENTITY_GRADE = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/**
 * Geometry - Handles Earth geometry creation and morphing
 */
export class Geometry {
    scene: any;
    THREE: any;
    spherePlane: any;
    cloudLayer: any;
    atmosphere: any;
    cubeUnfold: CubeUnfold | null;
    surfaceUniforms: SurfaceUniforms;
    vitality: number;
    flash: number;
    baseGrade: { m: number[]; o: number[] };

    constructor(scene: any, THREE: any) {
        this.scene = scene;
        this.THREE = THREE;
        this.spherePlane = null;
        this.cloudLayer = null;
        this.atmosphere = null;
        this.cubeUnfold = null;
        this.vitality = 1;
        this.flash = 0;
        this.baseGrade = { m: IDENTITY_GRADE.slice(), o: [0, 0, 0] };
        // uSurfaceFx fades night lights and ocean gloss out while the globe flattens into the map.
        // uVitality does the same when the planet dies, and uFlash is the last burst of light.
        this.surfaceUniforms = {
            uSunDirView: { value: new THREE.Vector3(1, 0, 0) },
            uSurfaceFx: { value: 1 },
            uVitality: { value: 1 },
            uFlash: { value: 0 },
            uColorMatrix: { value: new THREE.Matrix3() },
            uColorOffset: { value: new THREE.Vector3() }
        };
        this.createMorphingGeometry();
        this.createAtmosphere();
        this.createCloudLayer();

        const style = getMorphStyle();
        if (style !== 'classic') {
            const { map, emissiveMap } = this.spherePlane.material;
            this.cubeUnfold = new CubeUnfold(scene, THREE, map, style, emissiveMap, this.surfaceUniforms);
        }
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
            undefined,
            undefined,
            (e) => console.error('Earth texture load error', e)
        );
        earthTexture.colorSpace = this.THREE.SRGBColorSpace;
        earthTexture.minFilter = this.THREE.LinearMipmapLinearFilter;
        earthTexture.magFilter = this.THREE.LinearFilter;

        const nightTexture = loader.load(
            'textures/BlackMarble_2016_01deg.jpg',
            undefined,
            undefined,
            (e) => console.error('Night texture load error', e)
        );
        nightTexture.colorSpace = this.THREE.SRGBColorSpace;
        nightTexture.minFilter = this.THREE.LinearMipmapLinearFilter;
        nightTexture.magFilter = this.THREE.LinearFilter;

        const mat = new this.THREE.MeshStandardMaterial({
            map: earthTexture,
            emissiveMap: nightTexture,
            ...NIGHT_EMISSIVE,
            side: this.THREE.DoubleSide,
            metalness: 0,
            roughness: 1
        });

        mat.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, this.surfaceUniforms);
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\n${SURFACE_UNIFORMS_GLSL}`)
                .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${OCEAN_GLOSS_GLSL}`)
                .replace('#include <emissivemap_fragment>', nightLightsGlsl('texture2D( emissiveMap, vEmissiveMapUv )'))
                .replace('#include <colorspace_fragment>', `#include <colorspace_fragment>\n${COLOR_GRADE_APPLY_GLSL}`);
        };

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
            uniform vec3 uSunDirView;
            uniform mat3 uColorMatrix;
            uniform vec3 uColorOffset;
            uniform float uVitality;
            uniform float uFlash;
            varying vec3 vNormal;
            void main() {
                float intensity = pow( 0.6 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 2.0 );
                intensity = max(intensity, 0.0);
                float sunDot = dot( vNormal, uSunDirView );
                float day = smoothstep( -0.3, 0.4, sunDot );
                float twilight = smoothstep( -0.3, 0.0, sunDot ) * ( 1.0 - smoothstep( 0.0, 0.35, sunDot ) );
                vec3 color = mix( vec3( 0.3, 0.6, 1.0 ), vec3( 1.0, 0.55, 0.3 ), twilight * 0.5 );
                color = uColorMatrix * color + uColorOffset;
                color = mix( color, vec3( 1.0, 0.98, 0.92 ), uFlash );
                float shell = intensity * mix( 0.12, 1.0, day );
                float presence = max( uVitality, uFlash * 0.95 );
                gl_FragColor = vec4( color, 0.4 ) * shell * presence;
            }
        `;

        const atmosphereGeom = new this.THREE.SphereGeometry(2.8, 32, 32);
        const atmosphereMaterial = new this.THREE.ShaderMaterial({
            uniforms: {
                uSunDirView: this.surfaceUniforms.uSunDirView,
                uColorMatrix: this.surfaceUniforms.uColorMatrix,
                uColorOffset: this.surfaceUniforms.uColorOffset,
                uVitality: this.surfaceUniforms.uVitality,
                uFlash: this.surfaceUniforms.uFlash
            },
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
            'textures/Clouds.webp',
            undefined,
            undefined,
            (e) => console.error('Cloud texture load error', e)
        );
        cloudTexture.minFilter = this.THREE.LinearMipmapLinearFilter;
        cloudTexture.magFilter = this.THREE.LinearFilter;

        // Clouds.webp has no alpha channel, so its brightness drives the coverage
        const cloudMaterial = new this.THREE.MeshStandardMaterial({
            color: 0xf4f6fa,
            alphaMap: cloudTexture,
            transparent: true,
            opacity: CLOUD_OPACITY,
            side: this.THREE.FrontSide,
            metalness: 0,
            roughness: 1.0,
            alphaTest: 0.02,
            depthWrite: false,
            depthTest: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        cloudMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.uColorMatrix = this.surfaceUniforms.uColorMatrix;
            shader.uniforms.uColorOffset = this.surfaceUniforms.uColorOffset;
            shader.uniforms.uVitality = this.surfaceUniforms.uVitality;
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\n${COLOR_GRADE_GLSL}\nuniform float uVitality;`)
                .replace('#include <colorspace_fragment>', `#include <colorspace_fragment>\n${COLOR_GRADE_APPLY_GLSL}\ngl_FragColor.a *= uVitality;`);
        };

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

        this.surfaceUniforms.uSurfaceFx.value = 1 - MathUtils.clamp(progress / 0.15, 0, 1);

        if (this.cubeUnfold) {
            this.updateCubeTransformation(progress);
            if (this.atmosphere) {
                this.atmosphere.visible = progress === 0;
            }
            this.updateTilt(progress);
            return;
        }

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
     * Sphere → cube → net transition. The regular plane mesh is shown as the sphere at rest
     * and, for cube-fade only, again as the flat map once the net has faded into it.
     */
    updateCubeTransformation(progress) {
        const cubeUnfold = this.cubeUnfold;
        const { unfoldEnd, fadeEnd } = cubeUnfold.stages;
        const fadesIntoPlane = cubeUnfold.style === 'cube-fade';

        cubeUnfold.update(progress);

        if (progress === 0) {
            this.spherePlane.visible = true;
            this.spherePlane.morphTargetInfluences[0] = 1;
            this.setPlaneOpacity(1);
        } else if (!fadesIntoPlane || progress < unfoldEnd) {
            this.spherePlane.visible = false;
        } else {
            this.spherePlane.visible = true;
            this.spherePlane.morphTargetInfluences[0] = 0;
            this.setPlaneOpacity(progress >= fadeEnd ? 1 : cubeUnfold.stageProgress(progress).fade);
        }

        if (!this.cloudLayer?.morphTargetInfluences) return;

        if (fadesIntoPlane && progress >= fadeEnd) {
            this.cloudLayer.visible = true;
            this.cloudLayer.morphTargetInfluences[0] = 0;
            this.updateCloudLayerScaling(progress);
            this.cloudLayer.material.opacity *= MathUtils.clamp((progress - fadeEnd) / 0.06, 0, 1);
        } else {
            const opacity = CLOUD_OPACITY * (1 - MathUtils.clamp(progress / 0.08, 0, 1));
            this.cloudLayer.morphTargetInfluences[0] = 1;
            this.cloudLayer.scale.setScalar(1);
            this.cloudLayer.position.z = 0.02;
            this.cloudLayer.material.opacity = opacity;
            this.cloudLayer.visible = opacity > 0;
        }
    }

    setPlaneOpacity(opacity) {
        const material = this.spherePlane.material;
        const transparent = opacity < 1;
        material.opacity = opacity;
        if (material.transparent !== transparent) {
            material.transparent = transparent;
            material.needsUpdate = true;
        }
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
                    const fadeOpacity = Math.max(0, CLOUD_OPACITY * (1 - fadeProgress));
                    this.cloudLayer.material.opacity = fadeOpacity;
                } else {
                    this.cloudLayer.material.opacity = CLOUD_OPACITY;
                }
            } else {
                this.cloudLayer.material.opacity = CLOUD_OPACITY;
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

        if (this.cubeUnfold) {
            targetTilt = this.cubeUnfold.tilt(progress);
        }

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
        this.cubeUnfold?.setRotationY(rotationY);

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
     * Update the sun direction (in view space) used by night lights, ocean gloss and atmosphere
     */
    updateSunDirection(sunPosition, camera) {
        this.surfaceUniforms.uSunDirView.value
            .copy(sunPosition)
            .normalize()
            .transformDirection(camera.matrixWorldInverse);
    }

    setColorGrade(matrix: number[], offset: number[]) {
        this.baseGrade = { m: matrix.slice(), o: offset.slice() };
        this.applyColorGrade();
    }

    /**
     * 1 is a living Earth. 0 is a barren one. Flash is a short white-out on the way down.
     */
    setEpochVisual(vitality: number, flash: number) {
        this.vitality = vitality;
        this.flash = flash;
        this.surfaceUniforms.uVitality.value = vitality;
        this.surfaceUniforms.uFlash.value = flash;
        this.applyColorGrade();
    }

    applyColorGrade() {
        const living = this.vitality;
        const dead = 1 - living;
        const baseM = this.baseGrade.m;
        const baseO = this.baseGrade.o;
        const m = baseM.map((value, i) => value * living + DEAD_GRADE_MATRIX[i] * dead);
        const o = baseO.map((value, i) => value * living + DEAD_GRADE_OFFSET[i] * dead);
        const boost = this.flash * 0.48;
        this.surfaceUniforms.uColorMatrix.value.set(
            m[0], m[1], m[2],
            m[3], m[4], m[5],
            m[6], m[7], m[8]
        );
        this.surfaceUniforms.uColorOffset.value.set(o[0] + boost, o[1] + boost, o[2] + boost * 0.92);
    }

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

        this.cubeUnfold?.destroy();
    }
}
