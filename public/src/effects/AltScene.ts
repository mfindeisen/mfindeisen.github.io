import * as THREE from 'three';

export class AltScene {
    canvas: HTMLCanvasElement;
    renderer: THREE.WebGLRenderer | null = null;
    scene: THREE.Scene | null = null;
    camera: THREE.PerspectiveCamera | null = null;
    shapes: { 
        mesh: THREE.Mesh; 
        basePos: THREE.Vector3; 
        speedX: number; 
        speedY: number; 
        speedZ: number; 
        rotX: number; 
        rotY: number; 
        rotZ: number 
    }[] = [];
    mouseX: number = 0;
    mouseY: number = 0;
    targetMouseX: number = 0;
    targetMouseY: number = 0;
    isActive: boolean = false;
    animationFrameId: number | null = null;

    constructor(canvasId: string) {
        const element = document.getElementById(canvasId);
        if (!element) {
            console.error(`Canvas element with id ${canvasId} not found`);
            this.canvas = document.createElement('canvas'); // Fallback
            return;
        }
        this.canvas = element as HTMLCanvasElement;
        this.init();
    }

    private init() {
        // Initialize scene
        this.scene = new THREE.Scene();
        
        // Soft white background
        this.scene.background = new THREE.Color('#fcfbfa');

        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        this.camera.position.z = 15;

        // WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Add soft ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(ambientLight);

        // Directional light for specular highlights
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        // Add colorful point lights for vibrant glass refraction reflections
        const pinkLight = new THREE.PointLight(0xff007f, 18, 30);
        pinkLight.position.set(-8, 5, 5);
        this.scene.add(pinkLight);

        const cyanLight = new THREE.PointLight(0x00f0ff, 18, 30);
        cyanLight.position.set(8, -5, 5);
        this.scene.add(cyanLight);

        const orangeLight = new THREE.PointLight(0xff6c00, 18, 30);
        orangeLight.position.set(0, 8, -3);
        this.scene.add(orangeLight);

        // Generate geometries
        this.createFloatingShapes();

        // Mouse listeners
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
    }

    private createFloatingShapes() {
        if (!this.scene) return;

        const geometries = [
            new THREE.TorusKnotGeometry(1.0, 0.35, 80, 12),
            new THREE.SphereGeometry(1.2, 24, 24),
            new THREE.IcosahedronGeometry(1.3, 0),
            new THREE.TorusGeometry(1.0, 0.4, 12, 60),
            new THREE.ConeGeometry(1.0, 1.8, 24),
            new THREE.CylinderGeometry(0.6, 0.6, 1.8, 24)
        ];

        const colors = [
            0xff007f, // Neon Pink
            0x00f0ff, // Cyan
            0xff6c00, // Neon Orange
            0x8a2be2, // Violet
            0xffe600, // Neon Yellow
            0x39ff14  // Neon Green
        ];

        // Specific non-intersecting coordinates to ensure good distribution and spacing
        const positions = [
            new THREE.Vector3(-9, 4.5, 1),
            new THREE.Vector3(9, -4.5, -1),
            new THREE.Vector3(-7, -3.5, 0),
            new THREE.Vector3(7, 3.5, 2),
            new THREE.Vector3(0, 5.0, -2),
            new THREE.Vector3(-2, -5.0, 1)
        ];

        // Spawn 6 floating glass meshes
        for (let i = 0; i < 6; i++) {
            const geom = geometries[i].clone();
            const color = colors[i];
            const basePos = positions[i];

            // Material giving a physical clear glass bubble appearance
            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                roughness: 0.08,
                metalness: 0.1,
                transmission: 0.65, // Let ambient light and background grid pass through
                transparent: true,
                opacity: 0.95,
                ior: 1.55,
                thickness: 2.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.08,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geom, material);
            mesh.position.copy(basePos);

            const scale = 0.6 + Math.random() * 0.3;
            mesh.scale.set(scale, scale, scale);

            this.scene.add(mesh);

            this.shapes.push({
                mesh: mesh,
                basePos: basePos,
                speedX: (Math.random() - 0.5) * 0.003,
                speedY: (Math.random() - 0.5) * 0.003,
                speedZ: (Math.random() - 0.5) * 0.001,
                rotX: (Math.random() - 0.5) * 0.006,
                rotY: (Math.random() - 0.5) * 0.006,
                rotZ: (Math.random() - 0.5) * 0.003
            });
        }
    }

    private onMouseMove(e: MouseEvent) {
        this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    private onResize() {
        if (!this.canvas || !this.camera || !this.renderer) return;
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height, false);
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        setTimeout(() => this.onResize(), 80);
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private animate() {
        if (!this.isActive) return;

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

        // Smooth mouse lerping
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        this.shapes.forEach((shape, index) => {
            shape.mesh.rotation.x += shape.rotX;
            shape.mesh.rotation.y += shape.rotY;
            shape.mesh.rotation.z += shape.rotZ;

            const time = Date.now() * 0.0008;
            const floatOffset = Math.sin(time + index * 1.5) * 0.35;

            const mouseInfluenceX = this.mouseX * (1.8 + shape.mesh.position.z * 0.25);
            const mouseInfluenceY = this.mouseY * (1.8 + shape.mesh.position.z * 0.25);

            shape.mesh.position.x = shape.basePos.x + floatOffset * 0.4 + mouseInfluenceX;
            shape.mesh.position.y = shape.basePos.y + floatOffset * 0.7 + mouseInfluenceY;
        });

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
