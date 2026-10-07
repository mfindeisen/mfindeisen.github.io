import { MathUtils } from '../utils/MathUtils.js';
import { MAP_START_ZOOM, mapHandoffProgress } from '../map/MapManager.js';
import { COLOR_GRADE_APPLY_GLSL, NIGHT_EMISSIVE, OCEAN_GLOSS_GLSL, SURFACE_UNIFORMS_GLSL, type SurfaceUniforms, nightLightsGlsl } from './SurfaceShader.js';

/**
 * Selected via `?morph=` in the URL:
 *   cube-zoom (default)  sphere → cube → net, then the camera zooms into the net until it
 *                        matches the map's start view (lng 0, lat 0) and the map takes over
 *   cube-fade            sphere → cube → net, then the net crossfades into the flat plane
 *   classic              the original sphere → plane morph
 */
export type MorphStyle = 'cube-zoom' | 'cube-fade' | 'classic';

export function getMorphStyle(): MorphStyle {
    const param = new URLSearchParams(window.location.search).get('morph');
    return param === 'classic' || param === 'cube-fade' ? param : 'cube-zoom';
}

type CubeStyle = Exclude<MorphStyle, 'classic'>;

/**
 * Progress (0 = sphere, 1 = flat): 0..cubeEnd inflates the sphere into a cube,
 * cubeEnd..unfoldEnd hinges the faces open, and after that the style-specific ending runs
 * (zoom until the map handoff, or crossfade until fadeEnd).
 */
const STAGES: Record<CubeStyle, { cubeEnd: number; unfoldEnd: number; fadeEnd: number }> = {
    'cube-zoom': { cubeEnd: 0.3, unfoldEnd: 0.6, fadeEnd: 1 },
    'cube-fade': { cubeEnd: 0.3, unfoldEnd: 0.65, fadeEnd: 0.82 }
};

const CAMERA_START_Z = 15;
const CAMERA_UNFOLD_DOLLY = 8;
const MAP_TILE_SIZE = 512;

const HALF = 2.0;
const NET_OFFSET = 0.01;
const RADIUS = 2.5;
const SEGMENTS = 32;
const TILT = Math.PI * 23.5 / 180;

type FaceName = 'front' | 'right' | 'back' | 'left' | 'top' | 'bottom';

const FACES: { name: FaceName; n: number[]; u: number[]; v: number[] }[] = [
    { name: 'front', n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { name: 'right', n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { name: 'back', n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    { name: 'left', n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { name: 'top', n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { name: 'bottom', n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] }
];

export class CubeUnfold {
    THREE: any;
    scene: any;
    style: CubeStyle;
    stages: { cubeEnd: number; unfoldEnd: number; fadeEnd: number };
    mesh: any;
    material: any;
    cubePositions: Float32Array;
    spherePositions: Float32Array;
    directions: Float32Array;
    faceIndex: Uint8Array;
    vertsPerFace: number;

    constructor(scene: any, THREE: any, earthTexture: any, style: CubeStyle, nightTexture: any, surfaceUniforms: SurfaceUniforms) {
        this.scene = scene;
        this.THREE = THREE;
        this.style = style;
        this.stages = STAGES[style];
        this.vertsPerFace = (SEGMENTS + 1) * (SEGMENTS + 1);

        const total = this.vertsPerFace * FACES.length;
        this.cubePositions = new Float32Array(total * 3);
        this.spherePositions = new Float32Array(total * 3);
        this.directions = new Float32Array(total * 3);
        this.faceIndex = new Uint8Array(total);

        const geometry = this.buildGeometry();
        this.material = this.buildMaterial(earthTexture, nightTexture, surfaceUniforms);

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.mesh.renderOrder = 0;
        this.mesh.rotation.z = TILT;
        this.scene.add(this.mesh);
    }

    buildGeometry() {
        const THREE = this.THREE;
        const total = this.vertsPerFace * FACES.length;
        const uvs = new Float32Array(total * 2);
        const indices: number[] = [];

        FACES.forEach((face, f) => {
            const base = f * this.vertsPerFace;
            for (let j = 0; j <= SEGMENTS; j++) {
                for (let i = 0; i <= SEGMENTS; i++) {
                    const a = -1 + (2 * i) / SEGMENTS;
                    const b = -1 + (2 * j) / SEGMENTS;
                    const k = base + j * (SEGMENTS + 1) + i;

                    const x = HALF * (face.n[0] + a * face.u[0] + b * face.v[0]);
                    const y = HALF * (face.n[1] + a * face.u[1] + b * face.v[1]);
                    const z = HALF * (face.n[2] + a * face.u[2] + b * face.v[2]);
                    const len = Math.hypot(x, y, z);

                    this.cubePositions.set([x, y, z], k * 3);
                    this.directions.set([x / len, y / len, z / len], k * 3);
                    this.spherePositions.set([x / len * RADIUS, y / len * RADIUS, z / len * RADIUS], k * 3);
                    this.faceIndex[k] = f;

                    uvs[k * 2] = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
                    uvs[k * 2 + 1] = 1 - Math.acos(y / len) / Math.PI;
                }
            }
            for (let j = 0; j < SEGMENTS; j++) {
                for (let i = 0; i < SEGMENTS; i++) {
                    const v00 = base + j * (SEGMENTS + 1) + i;
                    const v10 = v00 + 1;
                    const v01 = v00 + SEGMENTS + 1;
                    const v11 = v01 + 1;
                    indices.push(v00, v10, v11, v00, v11, v01);
                }
            }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.spherePositions.slice(), 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(this.directions.slice(), 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute('aDir', new THREE.BufferAttribute(this.directions, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
        geometry.boundingSphere.radius = HALF * 8;
        return geometry;
    }

    /**
     * Samples the equirectangular texture per pixel from the sphere direction, so the
     * Earth stays correctly mapped on cube faces and in the net. Gradients come from
     * whichever u candidate is continuous at this pixel (Tarini's trick), which avoids a
     * mipmap seam at the antimeridian. Only the gradients are selected, never the
     * coordinate, so neighbouring pixels picking different candidates can't blow up mips.
     */
    buildMaterial(earthTexture: any, nightTexture: any, surfaceUniforms: SurfaceUniforms) {
        const THREE = this.THREE;
        const material = new THREE.MeshStandardMaterial({
            map: earthTexture,
            emissiveMap: nightTexture,
            ...NIGHT_EMISSIVE,
            side: THREE.DoubleSide,
            metalness: 0,
            roughness: 1,
            transparent: this.style === 'cube-fade'
        });

        material.onBeforeCompile = (shader: any) => {
            Object.assign(shader.uniforms, surfaceUniforms);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nattribute vec3 aDir;\nvarying vec3 vDir;')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDir = aDir;');

            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\nvarying vec3 vDir;\n${SURFACE_UNIFORMS_GLSL}`)
                .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${OCEAN_GLOSS_GLSL}`)
                .replace('#include <emissivemap_fragment>', nightLightsGlsl('textureGrad(emissiveMap, vec2(eqU1, eqV), eqDx, eqDy)'))
                .replace('#include <colorspace_fragment>', `#include <colorspace_fragment>\n${COLOR_GRADE_APPLY_GLSL}`)
                .replace('#include <map_fragment>', `
                    vec3 eqDir = normalize(vDir);
                    float eqU1 = atan(eqDir.x, eqDir.z) / 6.28318530718 + 0.5;
                    float eqU2 = fract(eqU1 + 0.5) - 0.5;
                    float eqV = 1.0 - acos(clamp(eqDir.y, -1.0, 1.0)) / PI;
                    bool eqUseU1 = fwidth(eqU1) <= fwidth(eqU2);
                    vec2 eqDx = vec2(eqUseU1 ? dFdx(eqU1) : dFdx(eqU2), dFdx(eqV));
                    vec2 eqDy = vec2(eqUseU1 ? dFdy(eqU1) : dFdy(eqU2), dFdy(eqV));
                    diffuseColor *= textureGrad(map, vec2(eqU1, eqV), eqDx, eqDy);
                `);
        };

        return material;
    }

    stageProgress(progress: number) {
        const { cubeEnd, unfoldEnd, fadeEnd } = this.stages;
        const clamp01 = (x: number) => MathUtils.clamp(x, 0, 1);
        return {
            cube: MathUtils.easeInOutCubic(clamp01(progress / cubeEnd)),
            unfold: MathUtils.easeInOutCubic(clamp01((progress - cubeEnd) / (unfoldEnd - cubeEnd))),
            zoom: MathUtils.easeInOutCubic(clamp01((progress - unfoldEnd) / (mapHandoffProgress() - unfoldEnd))),
            fade: clamp01((progress - unfoldEnd) / (fadeEnd - unfoldEnd))
        };
    }

    tilt(progress: number) {
        return TILT * (1 - this.stageProgress(progress).cube);
    }

    /**
     * Camera distance at which the front face shows the same longitude span as the map at
     * its start zoom. The front face is a gnomonic projection, so x = HALF * tan(lng).
     */
    mapMatchDistance(camera: any) {
        const lngSpan = (360 * window.innerWidth) / (MAP_TILE_SIZE * Math.pow(2, MAP_START_ZOOM));
        const halfWidth = HALF * Math.tan((lngSpan / 2) * Math.PI / 180);
        const halfFov = (camera.fov / 2) * Math.PI / 180;
        return halfWidth / (Math.tan(halfFov) * camera.aspect);
    }

    /**
     * Gentle dolly while the cube forms and unfolds, then an exponential zoom (constant
     * perceived speed) into the net until it lines up with the map.
     */
    cameraZ(progress: number, camera: any) {
        const { unfoldEnd } = this.stages;
        if (progress <= unfoldEnd) {
            return CAMERA_START_Z - progress * CAMERA_UNFOLD_DOLLY;
        }
        const startZ = CAMERA_START_Z - unfoldEnd * CAMERA_UNFOLD_DOLLY;
        const endZ = this.mapMatchDistance(camera) + NET_OFFSET;
        const { zoom } = this.stageProgress(progress);
        return startZ * Math.pow(endZ / startZ, zoom);
    }

    hinge(pivot: number[], axis: 'x' | 'y', angle: number) {
        const THREE = this.THREE;
        const toOrigin = new THREE.Matrix4().makeTranslation(-pivot[0], -pivot[1], -pivot[2]);
        const rotate = axis === 'x'
            ? new THREE.Matrix4().makeRotationX(angle)
            : new THREE.Matrix4().makeRotationY(angle);
        const back = new THREE.Matrix4().makeTranslation(pivot[0], pivot[1], pivot[2]);
        return back.multiply(rotate).multiply(toOrigin);
    }

    /**
     * Face transforms for the cross-shaped net. The front face stays in place, left/right/
     * top/bottom hinge off the front, and the back face hinges off the right face.
     */
    faceMatrices(unfold: number) {
        const THREE = this.THREE;
        const h = HALF;
        const quarter = Math.PI / 2;
        const sides = MathUtils.clamp(unfold / 0.75, 0, 1) * quarter;
        const backAngle = MathUtils.clamp((unfold - 0.35) / 0.65, 0, 1) * quarter;

        const right = this.hinge([h, 0, h], 'y', -sides);
        const matrices: Record<FaceName, any> = {
            front: new THREE.Matrix4(),
            right,
            back: right.clone().multiply(this.hinge([h, 0, -h], 'y', -backAngle)),
            left: this.hinge([-h, 0, h], 'y', sides),
            top: this.hinge([0, h, h], 'x', sides),
            bottom: this.hinge([0, -h, h], 'x', -sides)
        };

        const settle = new THREE.Matrix4().makeTranslation(0, 0, (NET_OFFSET - h) * unfold);
        FACES.forEach(face => matrices[face.name].premultiply(settle));
        return matrices;
    }

    update(progress: number) {
        const { cubeEnd, fadeEnd } = this.stages;
        this.mesh.visible = progress > 0 && (this.style === 'cube-zoom' || progress < fadeEnd);
        if (!this.mesh.visible) return;

        const { cube, unfold, fade } = this.stageProgress(progress);
        const position = this.mesh.geometry.attributes.position;
        const normal = this.mesh.geometry.attributes.normal;
        const pos = position.array as Float32Array;
        const nrm = normal.array as Float32Array;
        const count = this.faceIndex.length;

        if (progress <= cubeEnd) {
            for (let k = 0; k < count; k++) {
                const o = k * 3;
                const face = FACES[this.faceIndex[k]].n;
                for (let c = 0; c < 3; c++) {
                    pos[o + c] = this.spherePositions[o + c] + (this.cubePositions[o + c] - this.spherePositions[o + c]) * cube;
                    nrm[o + c] = this.directions[o + c] + (face[c] - this.directions[o + c]) * cube;
                }
                const len = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1;
                nrm[o] /= len; nrm[o + 1] /= len; nrm[o + 2] /= len;
            }
        } else {
            const THREE = this.THREE;
            const matrices = this.faceMatrices(unfold);
            const faceNormals = FACES.map(face =>
                new THREE.Vector3(face.n[0], face.n[1], face.n[2]).transformDirection(matrices[face.name])
            );
            const v = new THREE.Vector3();
            for (let k = 0; k < count; k++) {
                const o = k * 3;
                const f = this.faceIndex[k];
                v.set(this.cubePositions[o], this.cubePositions[o + 1], this.cubePositions[o + 2])
                    .applyMatrix4(matrices[FACES[f].name]);
                pos[o] = v.x; pos[o + 1] = v.y; pos[o + 2] = v.z;
                const n = faceNormals[f];
                nrm[o] = n.x; nrm[o + 1] = n.y; nrm[o + 2] = n.z;
            }
        }

        position.needsUpdate = true;
        normal.needsUpdate = true;

        if (this.style === 'cube-fade') {
            this.material.opacity = 1 - fade;
            this.material.depthWrite = fade === 0;
        }

        this.mesh.rotation.z = this.tilt(progress);
    }

    setRotationY(rotationY: number) {
        this.mesh.rotation.y = rotationY;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
    }
}
