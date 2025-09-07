import * as THREE from '/three/build/three.module.js';

export class EarthScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.earth = null;
        this.originalGeometry = null;
        this.targetGeometry = null;
        this.currentProgress = 0;
        
        this.init();
    }

    init() {
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60, // smaller FOV for less distortion
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5); // farther back

        // Create starfield background
        this.createStarfield();
        
        // Add realistic lighting
        this.setupRealisticLights();
        
        // Create sun
        this.createSun();
        
        // Create earth
        this.createEarth();
        
        console.log('Earth scene initialized');
    }

    setupRealisticLights() {
        // Strong ambient light to ensure Earth is always visible
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);

        // Main sun light from front-right
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(3, 2, 8);
        this.sunLight.target.position.set(0, 0, 0);
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
        
        // Fill light from opposite side to ensure shadow side is visible
        const fillLight = new THREE.DirectionalLight(0x6699ff, 0.6);
        fillLight.position.set(-3, -1, -4);
        this.scene.add(fillLight);
        
        // Additional side lighting for better coverage
        const sideLight = new THREE.DirectionalLight(0xffffaa, 0.4);
        sideLight.position.set(0, 5, 0);
        this.scene.add(sideLight);
        
        // Store fixed sun position for visual sun object
        this.sunPosition = new THREE.Vector3(3, 2, 8);
        
        console.log('Lighting setup complete');
    }

    createStarfield() {
        // Create thousands of stars in the background
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 10000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount * 3; i += 3) {
            // Generate stars in a large sphere around the scene
            const radius = 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            sizeAttenuation: false
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    createSun() {
        // Create sun geometry
        const sunGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        
        // Create sun material with glow effect
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff44,
            transparent: true,
            opacity: 0.9
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.copy(this.sunPosition);
        this.scene.add(this.sun);
        
        // Add sun glow effect
        const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff44,
            transparent: true,
            opacity: 0.3
        });
        
        this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sunGlow.position.copy(this.sunPosition);
        this.scene.add(this.sunGlow);
    }

    createEarth() {
        // Create two separate halves for natural orange-peel unwrapping
        this.createEarthHalves();
    }

    createEarthHalves() {
        // Create left half of Earth (0 to 0.5 U coordinate)
        const leftGeom = new THREE.PlaneGeometry(Math.PI, Math.PI, 32, 32);
        const rightGeom = new THREE.PlaneGeometry(Math.PI, Math.PI, 32, 32);
        
        // Position left half
        leftGeom.translate(-Math.PI/2, 0, 0);
        // Position right half  
        rightGeom.translate(Math.PI/2, 0, 0);
        
        // Adjust UV coordinates for left half (0.5 to 1.0 of texture) - right side of cut
        this.adjustUVs(leftGeom, 0.5, 1.0);
        // Adjust UV coordinates for right half (0 to 0.5 of texture) - left side of cut  
        this.adjustUVs(rightGeom, 0, 0.5);
        
        // Create sphere morph targets for both halves
        this.createSphereTarget(leftGeom, 0, 0.5);
        this.createSphereTarget(rightGeom, 0.5, 1.0);
        
        // Load texture
        const textureLoader = new THREE.TextureLoader();
        
        // Create material with transparency for fading
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            morphTargets: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1.0
        });
        
        textureLoader.load('/textures/world.topo.bathy.200407.3x5400x2700.jpg',
            (texture) => {
                console.log('NASA Earth texture loaded successfully');
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = false;
                material.map = texture;
                material.needsUpdate = true;
            },
            undefined,
            (error) => {
                console.error('NASA texture loading failed');
            }
        );
        
        // Create meshes for both halves
        this.earthLeft = new THREE.Mesh(leftGeom, material);
        this.earthRight = new THREE.Mesh(rightGeom, material);
        
        // Store reference to material for opacity control
        this.earthMaterial = material;
        
        // Start in sphere mode
        this.earthLeft.morphTargetInfluences[0] = 1;
        this.earthRight.morphTargetInfluences[0] = 1;
        
        // Rotate so cut is on back
        this.earthLeft.rotation.y = Math.PI;
        this.earthRight.rotation.y = Math.PI;
        
        this.scene.add(this.earthLeft);
        this.scene.add(this.earthRight);
        
        // Store reference for updateTransformation
        this.earth = { 
            morphTargetInfluences: [1],
            rotation: { set: () => {}, y: 0 },
            scale: { set: () => {} }
        };
        
        console.log('Earth halves created');
    }
    
    adjustUVs(geometry, uStart, uEnd) {
        const uvs = geometry.attributes.uv;
        const newUvs = [];
        
        for (let i = 0; i < uvs.count; i++) {
            const u = uvs.getX(i);
            const v = uvs.getY(i);
            
            // Map U coordinate to the specified range of the texture and flip horizontally
            const mappedU = uStart + (uEnd - uStart) * (1 - u); // Flip U to fix plane mirroring
            newUvs.push(mappedU, 1 - v); // Fix vertical orientation
        }
        
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
    }
    
    createSphereTarget(geometry, uStart, uEnd) {
        const sphereFormation = [];
        const uvs = geometry.attributes.uv;
        
        for (let i = 0; i < uvs.count; i++) {
            const u = uvs.getX(i);
            const v = uvs.getY(i);
            
            const phi = Math.PI * v;
            const theta = Math.PI * 2 * (1 - u); // Flip horizontally to fix mirroring
            
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);
            
            sphereFormation.push(x, y, z);
        }
        
        geometry.morphAttributes.position = [];
        geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(sphereFormation, 3);
    }

    createEarthTexture() {
        // Create a more detailed procedural earth texture
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        return texture;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    updateTransformation(progress) {
        if (!this.earthLeft || !this.earthRight) {
            console.log('No earth halves found');
            return;
        }
        
        console.log('updateTransformation called with progress:', progress);
        this.currentProgress = progress;
        
        // Smooth the progress using easing
        const easedProgress = this.easeInOutCubic(progress);
        
        // Use morph targets: 1 = sphere, 0 = plane
        // As progress increases (0 to 1), we want to go from sphere (1) to plane (0)
        const morphValue = 1 - easedProgress;
        this.earthLeft.morphTargetInfluences[0] = morphValue;
        this.earthRight.morphTargetInfluences[0] = morphValue;
        
        // Update camera position
        this.updateTransform(easedProgress);
    }



    updateTransform(progress) {
        if (!this.earth) return;

        // Debug: log progress to see what's happening
        if (progress > 0.9) {
            console.log(`Progress: ${progress}, Morph influence: ${this.earth.morphTargetInfluences[0]}`);
        }

        // Only add final rotation at the very end
        if (progress >= 0.9) {
            // Capture the rotation when morphing ends (at progress 0.9)
            if (!this.rotationAtMorphEnd && progress >= 0.9) {
                this.rotationAtMorphEnd = this.earthLeft.rotation.y;
            }
            
            // Calculate shortest path to desired final rotation (π = back cut facing away, proper orientation)
            const targetRotation = Math.PI;
            let rotationDifference = targetRotation - this.rotationAtMorphEnd;
            
            // Ensure we rotate the shortest way (never more than 180 degrees)
            while (rotationDifference > Math.PI) rotationDifference -= 2 * Math.PI;
            while (rotationDifference < -Math.PI) rotationDifference += 2 * Math.PI;
            
            // Apply the rotation over the final 10%
            const finalProgress = (progress - 0.9) / 0.1; // 0 to 1 over last 10%
            const currentRotation = this.rotationAtMorphEnd + (rotationDifference * finalProgress);
            
            this.earthLeft.rotation.set(0, currentRotation, 0);
            this.earthRight.rotation.set(0, currentRotation, 0);
        } else {
            // Reset when not in final rotation phase
            this.rotationAtMorphEnd = null;
        }
        // During morphing (0-90%): rotation is naturally stopped by the update() function
        
        // Keep same scale
        this.earth.scale.set(1, 1, 1);
        
        // Move camera back to see the full unwrapped plane, then zoom in slowly at the end
        let cameraZ;
        if (progress < 0.85) {
            // Normal camera movement during morphing and rotation (0-85%)
            cameraZ = 5 + progress * 3; // start farther back and move farther
            this.earthMaterial.opacity = 1.0; // Fully visible
        } else {
            // Final zoom: move camera close to fill screen with map (85-100%)
            const zoomProgress = (progress - 0.85) / 0.15; // 0 to 1 over last 15%
            const startZ = 5 + (0.85 * 3); // Position at 85% progress
            const endZ = 2; // Close zoom to fill screen
            cameraZ = startZ + (endZ - startZ) * this.easeInOutCubic(zoomProgress);
            
            // Fade out 3D Earth during final zoom phase
            if (progress > 0.95) {
                const fadeProgress = (progress - 0.95) / 0.05; // Fade in last 5%
                this.earthMaterial.opacity = 1.0 - fadeProgress;
            } else {
                this.earthMaterial.opacity = 1.0;
            }
        }
        
        this.camera.position.set(0, 0, cameraZ);
        this.camera.rotation.set(0, 0, 0);
    }

    easeInOutCubic(t) {
        // Smooth easing for steady unwrapping
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    update() {
        // Any per-frame updates can go here
        if (this.earthLeft && this.earthRight && this.currentProgress === 0) {
            // Gentle rotation when not unwrapping - west to east (counterclockwise)
            this.earthLeft.rotation.y += 0.005;
            this.earthRight.rotation.y += 0.005;
        }
        
        // Ensure sun light stays fixed in position
        if (this.sunLight) {
            this.sunLight.position.set(3, 2, 8);
            this.sunLight.target.position.set(0, 0, 0);
        }
        
        // Subtle starfield rotation
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
            this.stars.rotation.x += 0.0001;
        }
        
        // Subtle sun glow animation
        if (this.sunGlow) {
            const time = Date.now() * 0.001;
            this.sunGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        }
    }
}
