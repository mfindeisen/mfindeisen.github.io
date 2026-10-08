import * as THREE from 'three';

/**
 * EasterEggs - Handles astronaut, shooting stars, and satellites
 */
export class EasterEggs {
    scene: any;
    astronaut: any;
    shootingStars: any[];
    satellites: any[];
    astronautLeftLeg: any;
    astronautRightLeg: any;
    astronautThrusters: any[];
    astronautVisible: boolean;
    astronautJourneyStarted: boolean;
    astronautNextAppearanceTime: number;
    astronautExiled: boolean;
    astronautFlight: 'normal' | 'departing' | 'returning';
    jetpackThrusting: boolean;
    jetpackThrustCycle: number;
    jetpackThrustDuration: number;
    jetpackRestDuration: number;
    jetpackCycleStart: number;
    jetpackFlames: any[];
    legMovementTime: number;
    legMovementSpeed: number;
    lastLegMovement: number;
    legMovementInterval: number;
    jetpackLights: any[];
    lastShootingStarTime: number;
    shootingStarCooldown: number;
    shootingStarMaterial: any;
    astronautJourneySpeed: number;
    astronautJourneyProgress: number;
    astronautStartPos: any;
    astronautEndPos: any;
    timeScale: number;
    astronautBoost: number;
    thrusterWorldPos: THREE.Vector3;

    constructor(scene: any) {
        this.timeScale = 1;
        this.astronautBoost = 1;
        this.scene = scene;
        this.astronaut = null;
        this.shootingStars = [];
        this.satellites = [];
        
        this.astronautLeftLeg = null;
        this.astronautRightLeg = null;
        this.astronautThrusters = [];
        this.astronautVisible = false;
        this.astronautJourneyStarted = false;
        this.astronautNextAppearanceTime = 0;
        this.astronautExiled = false;
        this.astronautFlight = 'normal';
        this.jetpackThrusting = false;
        this.jetpackThrustCycle = 0;
        this.jetpackThrustDuration = 0;
        this.jetpackRestDuration = 0;
        this.jetpackCycleStart = 0;
        this.jetpackFlames = [];
        this.legMovementTime = 0;
        this.legMovementSpeed = 0;
        this.lastLegMovement = 0;
        this.legMovementInterval = 0;
        this.jetpackLights = [];
        this.lastShootingStarTime = 0;
        this.shootingStarCooldown = 0;
        this.shootingStarMaterial = null;
        this.astronautJourneySpeed = 0;
        this.astronautJourneyProgress = 0;
        this.astronautStartPos = null;
        this.astronautEndPos = null;
        this.thrusterWorldPos = new THREE.Vector3();

        this.init();
    }

    /**
     * Initialize all easter eggs
     */
    init() {
        this.createAstronaut();
        this.createShootingStars();
        this.createSatellites();
    }

    /**
     * Create astronaut
     */
    createAstronaut() {
        console.log('Creating astronaut easter egg');

        this.astronaut = new THREE.Group();

        const suitMaterial = new THREE.MeshStandardMaterial({
            color: 0xf2f4f7,
            roughness: 0.42,
            metalness: 0.08
        });
        const darkMaterial = new THREE.MeshStandardMaterial({
            color: 0x2b2e33,
            roughness: 0.45,
            metalness: 0.35
        });
        const accentMaterial = new THREE.MeshStandardMaterial({
            color: 0xe85d04,
            roughness: 0.48,
            metalness: 0.12
        });
        const packMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3f48,
            roughness: 0.38,
            metalness: 0.55
        });
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0xf3c54a,
            roughness: 0.12,
            metalness: 0.82,
            emissive: 0xc49a22,
            emissiveIntensity: 0.38
        });

        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), suitMaterial);
        this.astronaut.add(body);

        const addLimb = (start, end, radius, material) => {
            const dir = new THREE.Vector3().subVectors(end, start);
            const length = dir.length();
            const mesh = new THREE.Mesh(
                new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 1.6), 4, 8),
                material
            );
            mesh.position.copy(start).add(end).multiplyScalar(0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
            this.astronaut.add(mesh);
            return mesh;
        };

        const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), accentMaterial);
        chestStripe.position.set(0, -0.025, 0.048);
        this.astronaut.add(chestStripe);

        const control = new THREE.Group();
        control.position.set(0, 0.018, 0.09);
        this.astronaut.add(control);

        const controlBox = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.038, 0.03), suitMaterial);
        control.add(controlBox);

        const controlPanel = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.014, 0.004), darkMaterial);
        controlPanel.position.set(0, 0.01, 0.016);
        control.add(controlPanel);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.01, 0.01), suitMaterial);
        rail.position.set(0, 0, 0.03);
        control.add(rail);

        const handleGeometry = new THREE.BoxGeometry(0.024, 0.02, 0.048);
        const leftHandle = new THREE.Mesh(handleGeometry, suitMaterial);
        leftHandle.position.set(-0.06, 0, 0.036);
        control.add(leftHandle);
        const rightHandle = new THREE.Mesh(handleGeometry, suitMaterial);
        rightHandle.position.set(0.06, 0, 0.036);
        control.add(rightHandle);

        const helmetRadius = 0.072;
        const helmetY = 0.125;

        const helmet = new THREE.Mesh(new THREE.SphereGeometry(helmetRadius, 20, 16), suitMaterial);
        helmet.position.y = helmetY;
        this.astronaut.add(helmet);

        // EMU gold bubble: front hemisphere, same center as the shell
        const visor = new THREE.Mesh(
            new THREE.SphereGeometry(helmetRadius * 1.045, 20, 14, 0, Math.PI),
            visorMaterial
        );
        visor.position.set(0, helmetY, 0.006);
        visor.scale.set(1, 1, 1.12);
        this.astronaut.add(visor);

        const visorRim = new THREE.Mesh(
            new THREE.TorusGeometry(helmetRadius * 0.99, 0.006, 8, 24),
            darkMaterial
        );
        visorRim.position.set(0, helmetY, 0.004);
        this.astronaut.add(visorRim);

        const helmetRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.05, 0.008, 8, 16),
            darkMaterial
        );
        helmetRim.position.y = 0.068;
        helmetRim.rotation.x = Math.PI / 2;
        this.astronaut.add(helmetRim);

        const leftShoulder = new THREE.Vector3(-0.055, 0.055, 0.02);
        const leftElbow = new THREE.Vector3(-0.09, 0.02, 0.055);
        const leftHand = new THREE.Vector3(-0.06, 0.018, 0.125);
        addLimb(leftShoulder, leftElbow, 0.017, suitMaterial);
        addLimb(leftElbow, leftHand, 0.016, suitMaterial);

        const rightShoulder = new THREE.Vector3(0.055, 0.055, 0.02);
        const rightElbow = new THREE.Vector3(0.09, 0.02, 0.055);
        const rightHand = new THREE.Vector3(0.06, 0.018, 0.125);
        addLimb(rightShoulder, rightElbow, 0.017, suitMaterial);
        addLimb(rightElbow, rightHand, 0.016, suitMaterial);

        const gloveGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const leftGlove = new THREE.Mesh(gloveGeometry, suitMaterial);
        leftGlove.position.copy(leftHand);
        this.astronaut.add(leftGlove);
        const rightGlove = new THREE.Mesh(gloveGeometry, suitMaterial);
        rightGlove.position.copy(rightHand);
        this.astronaut.add(rightGlove);

        const legGeometry = new THREE.CapsuleGeometry(0.024, 0.09, 4, 8);
        const bootGeometry = new THREE.SphereGeometry(0.028, 8, 8);

        const leftLeg = new THREE.Group();
        leftLeg.position.set(-0.03, -0.12, 0);
        const leftLegMesh = new THREE.Mesh(legGeometry, suitMaterial);
        leftLeg.add(leftLegMesh);
        const leftBoot = new THREE.Mesh(bootGeometry, darkMaterial);
        leftBoot.position.y = -0.07;
        leftLeg.add(leftBoot);
        this.astronaut.add(leftLeg);

        const rightLeg = new THREE.Group();
        rightLeg.position.set(0.03, -0.12, 0);
        const rightLegMesh = new THREE.Mesh(legGeometry, suitMaterial);
        rightLeg.add(rightLegMesh);
        const rightBoot = new THREE.Mesh(bootGeometry, darkMaterial);
        rightBoot.position.y = -0.07;
        rightLeg.add(rightBoot);
        this.astronaut.add(rightLeg);

        this.astronautLeftLeg = leftLeg;
        this.astronautRightLeg = rightLeg;

        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.055), packMaterial);
        pack.position.set(0, 0.02, -0.085);
        this.astronaut.add(pack);

        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.003, 0.003, 0.06, 6),
            darkMaterial
        );
        antenna.position.set(0.03, 0.1, -0.085);
        this.astronaut.add(antenna);

        const thrusterGeometry = new THREE.CylinderGeometry(0.014, 0.018, 0.032, 8);
        const leftThruster = new THREE.Mesh(thrusterGeometry, darkMaterial);
        leftThruster.position.set(-0.028, -0.03, -0.12);
        leftThruster.rotation.x = Math.PI / 2;
        this.astronaut.add(leftThruster);

        const rightThruster = new THREE.Mesh(thrusterGeometry, darkMaterial);
        rightThruster.position.set(0.028, -0.03, -0.12);
        rightThruster.rotation.x = Math.PI / 2;
        this.astronaut.add(rightThruster);

        this.astronautThrusters = [leftThruster, rightThruster];

        this.astronautVisible = false;
        this.astronautJourneyStarted = false;
        this.astronautNextAppearanceTime = Date.now() + (3000 + Math.random() * 5000);

        this.jetpackThrusting = false;
        this.jetpackThrustCycle = 0;
        this.jetpackThrustDuration = 2000;
        this.jetpackRestDuration = 1500;
        this.jetpackCycleStart = 0;

        this.legMovementTime = 0;
        this.legMovementSpeed = 0.003;
        this.lastLegMovement = 0;
        this.legMovementInterval = 3000 + Math.random() * 4000;

        this.createJetpackFlames();

        this.astronaut.visible = false;
        this.astronaut.scale.setScalar(3.0);

        this.scene.add(this.astronaut);
        console.log('Astronaut created and added to orbit around Earth');
    }

    /**
     * Create jetpack flames.
     * Lights stay in the scene graph at intensity 0 so shader light counts never change.
     */
    createJetpackFlames() {
        this.jetpackFlames = [];
        this.jetpackLights = [];

        for (let i = 0; i < this.astronautThrusters.length; i++) {
            const thruster = this.astronautThrusters[i];

            const glowGeometry = new THREE.SphereGeometry(0.01, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0
            });

            const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
            glowSphere.position.copy(thruster.position);
            glowSphere.position.z -= 0.05;
            this.astronaut.add(glowSphere);
            this.jetpackFlames.push(glowSphere);

            const thrustLight = new THREE.PointLight(0x00aaff, 0, 3);
            this.scene.add(thrustLight);
            this.jetpackLights.push(thrustLight);
        }
    }

    /**
     * Create shooting stars system
     */
    createShootingStars() {
        console.log('Creating shooting stars system');
        
        this.shootingStars = [];
        this.lastShootingStarTime = 0;
        this.shootingStarCooldown = 15000;
        
        this.shootingStarMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
    }

    /**
     * Create satellites on varied, real-world-inspired orbital planes
     * (equatorial, inclined / GPS-like, polar, sun-synchronous).
     */
    createSatellites() {
        console.log('Creating satellites');

        this.satellites = [];

        // Radii vs Earth R=2.5: LEO ~1.2–1.4R, MEO compressed ~3–4R, GEO-ish ~4–5R
        // (true GEO is ~6.6R / 16.5 — too far to read, so outer band stays ~8–12)
        const orbitProfiles = [
            { inclinationDeg: 0, radius: 10.5, speed: 0.00032 },  // equatorial / GEO-ish
            { inclinationDeg: 0, radius: 11.8, speed: 0.00028 },
            { inclinationDeg: 28, radius: 3.2, speed: 0.0018 },   // low-inclination LEO
            { inclinationDeg: 51.6, radius: 3.05, speed: 0.0020 },// ISS-like
            { inclinationDeg: 55, radius: 8.5, speed: 0.00055 },  // GPS / MEO-like
            { inclinationDeg: 55, radius: 9.2, speed: 0.00050 },
            { inclinationDeg: 63.4, radius: 7.8, speed: 0.00062 },// Molniya-ish inclination
            { inclinationDeg: 90, radius: 3.15, speed: 0.0019 },  // polar
            { inclinationDeg: 90, radius: 3.4, speed: 0.0017 },
            { inclinationDeg: 98, radius: 3.25, speed: 0.00185 }, // sun-synchronous
            { inclinationDeg: 98, radius: 3.5, speed: 0.00165 },
            { inclinationDeg: 70, radius: 8.0, speed: 0.00058 }
        ];

        for (let i = 0; i < orbitProfiles.length; i++) {
            const profile = orbitProfiles[i];
            const satellite = new THREE.Group();
            const scale = 0.75 + Math.random() * 0.55;

            const bodyGeometry = new THREE.BoxGeometry(0.04 * scale, 0.04 * scale, 0.06 * scale);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            satellite.add(body);

            const panelGeometry = new THREE.BoxGeometry(0.08 * scale, 0.01 * scale, 0.06 * scale);
            const panelMaterial = new THREE.MeshStandardMaterial({
                color: 0x001133,
                metalness: 0.2,
                roughness: 0.8
            });

            const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            leftPanel.position.x = -0.06 * scale;
            satellite.add(leftPanel);

            const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            rightPanel.position.x = 0.06 * scale;
            satellite.add(rightPanel);

            const antennaGeometry = new THREE.CylinderGeometry(0.001 * scale, 0.001 * scale, 0.03 * scale, 4);
            const antennaMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.9
            });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.y = 0.035 * scale;
            satellite.add(antenna);

            const satelliteData = {
                group: satellite,
                orbitRadius: profile.radius + (Math.random() - 0.5) * 0.25,
                orbitSpeed: profile.speed * (0.9 + Math.random() * 0.2),
                orbitAngle: Math.random() * Math.PI * 2,
                inclination: profile.inclinationDeg * Math.PI / 180,
                // Rotate the orbital plane around Y so paths don't all share one meridian
                raan: (i / orbitProfiles.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
                spin: Math.random() * Math.PI * 2,
                spinSpeed: 0.0015 + Math.random() * 0.003
            };

            this.satellites.push(satelliteData);
            this.scene.add(satellite);
        }

        console.log('Satellites created:', this.satellites.length);
    }

    /**
     * Position on an inclined circular orbit (Y-up): inclination from the XZ plane,
     * RAAN rotates that plane around Y.
     */
    satelliteOrbitPosition(radius: number, angle: number, inclination: number, raan: number) {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const cosI = Math.cos(inclination);
        const sinI = Math.sin(inclination);
        const cosO = Math.cos(raan);
        const sinO = Math.sin(raan);

        return {
            x: radius * (cosO * cosA - sinO * cosI * sinA),
            y: radius * (sinI * sinA),
            z: radius * (sinO * cosA + cosO * cosI * sinA)
        };
    }

    /**
     * Update all easter eggs
     */
    update() {
        this.updateAstronautPosition();
        this.updateShootingStars();
        this.updateSatellites();
    }

    /**
     * Update astronaut position and animation
     */
    updateAstronautPosition() {
        if (!this.astronaut) return;
        
        const currentTime = Date.now();

        if (this.astronautExiled && !this.astronautVisible) return;
        
        if (!this.astronautExiled && !this.astronautVisible && currentTime > this.astronautNextAppearanceTime) {
            this.startAstronautJourney();
        }
        
        if (this.astronautJourneyStarted && this.astronautVisible) {
            this.updateJetpackThrust(currentTime);
            this.updateAstronautLegs(currentTime);
            
            let currentSpeed: number;
            if (this.astronautFlight === 'departing') {
                currentSpeed = this.astronautJourneySpeed;
            } else {
                const scale = this.astronautFlight === 'returning' ? Math.max(this.timeScale, 1) : this.timeScale;
                currentSpeed = this.astronautJourneySpeed * this.astronautBoost * scale;
                currentSpeed *= this.jetpackThrusting ? 2.5 : 0.5;
            }
            
            this.astronautJourneyProgress += currentSpeed;
            
            const t = this.astronautJourneyProgress;
            const x = this.astronautStartPos.x + (this.astronautEndPos.x - this.astronautStartPos.x) * t;
            const y = this.astronautStartPos.y + (this.astronautEndPos.y - this.astronautStartPos.y) * t
                + Math.sin(currentTime * 0.001) * 0.05;
            const z = this.astronautStartPos.z + (this.astronautEndPos.z - this.astronautStartPos.z) * t;

            this.astronaut.position.set(x, y, z);
            
            const direction = new THREE.Vector3(
                this.astronautEndPos.x - this.astronautStartPos.x,
                this.astronautEndPos.y - this.astronautStartPos.y,
                this.astronautEndPos.z - this.astronautStartPos.z
            ).normalize();
            
            this.astronaut.lookAt(
                this.astronaut.position.x + direction.x,
                this.astronaut.position.y + direction.y,
                this.astronaut.position.z + direction.z
            );
            
            if (this.astronautJourneyProgress >= 1.0) {
                this.endAstronautJourney();
            }
        }
    }

    /**
     * Start astronaut journey — varied flybys that clear Earth (front/back/above/diagonal)
     */
    startAstronautJourney() {
        console.log('Astronaut appearing for journey');

        const direction = Math.random() < 0.5 ? -1 : 1;
        const earthRadius = 2.5;
        const clearance = 1.2 + Math.random() * 1.4;
        const startX = direction * (20 + Math.random() * 5);
        const endX = -direction * (20 + Math.random() * 5);

        // Pick a flyby style for variety
        const style = Math.floor(Math.random() * 5);
        let startY: number;
        let startZ: number;
        let endY: number;
        let endZ: number;

        if (style === 0) {
            // In front of Earth (toward camera)
            const z = earthRadius + clearance;
            startY = (Math.random() - 0.5) * 5;
            endY = startY + (Math.random() - 0.5) * 3;
            startZ = z;
            endZ = z + (Math.random() - 0.5) * 1.2;
        } else if (style === 1) {
            // Behind Earth
            const z = -(earthRadius + clearance);
            startY = (Math.random() - 0.5) * 5;
            endY = startY + (Math.random() - 0.5) * 3;
            startZ = z;
            endZ = z + (Math.random() - 0.5) * 1.2;
        } else if (style === 2) {
            // Above
            const y = earthRadius + clearance;
            startY = y;
            endY = y + (Math.random() - 0.5) * 1.5;
            startZ = (Math.random() - 0.5) * 4;
            endZ = startZ + (Math.random() - 0.5) * 2;
        } else if (style === 3) {
            // Below
            const y = -(earthRadius + clearance);
            startY = y;
            endY = y + (Math.random() - 0.5) * 1.5;
            startZ = (Math.random() - 0.5) * 4;
            endZ = startZ + (Math.random() - 0.5) * 2;
        } else {
            // Diagonal / skewed pass — offset both Y and Z so the path misses Earth
            const ySign = Math.random() < 0.5 ? 1 : -1;
            const zSign = Math.random() < 0.5 ? 1 : -1;
            startY = ySign * (2 + Math.random() * 4);
            endY = ySign * (2 + Math.random() * 4) * (Math.random() < 0.4 ? -1 : 1);
            startZ = zSign * (2 + Math.random() * 3);
            endZ = zSign * (2 + Math.random() * 3) * (Math.random() < 0.4 ? -1 : 1);
        }

        this.astronautStartPos = { x: startX, y: startY, z: startZ };
        this.astronautEndPos = { x: endX, y: endY, z: endZ };

        // Nudge the closest approach away from Earth's core if a diagonal clips it
        this.ensureFlybyClearsEarth(earthRadius + 1.0);

        this.astronautJourneyProgress = 0;
        this.astronautJourneySpeed = 0.0005 + Math.random() * 0.0003;
        this.astronautJourneyStarted = true;
        this.astronautVisible = true;

        this.astronaut.position.set(
            this.astronautStartPos.x,
            this.astronautStartPos.y,
            this.astronautStartPos.z
        );

        this.astronaut.visible = true;
    }

    /**
     * If the straight flyby would pierce Earth, shift the whole path so the
     * closest point clears the surface (preserves direction, avoids pole-only arcs).
     */
    ensureFlybyClearsEarth(minDistance: number) {
        const start = this.astronautStartPos;
        const end = this.astronautEndPos;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        if (lenSq < 1e-6) return;

        const t = Math.max(0, Math.min(1, -(start.x * dx + start.y * dy + start.z * dz) / lenSq));
        const cx = start.x + dx * t;
        const cy = start.y + dy * t;
        const cz = start.z + dz * t;
        const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
        if (dist >= minDistance) return;

        // Prefer pushing along the smaller of |y| / |z| so front/back/above/below stay recognizable
        let ox = 0;
        let oy = 0;
        let oz = 0;
        if (dist > 1e-4) {
            const push = (minDistance - dist) / dist;
            ox = cx * push;
            oy = cy * push;
            oz = cz * push;
        } else {
            // Path through the origin — pick a random perpendicular offset
            const angle = Math.random() * Math.PI * 2;
            oy = Math.cos(angle) * minDistance;
            oz = Math.sin(angle) * minDistance;
        }

        this.astronautStartPos = { x: start.x + ox, y: start.y + oy, z: start.z + oz };
        this.astronautEndPos = { x: end.x + ox, y: end.y + oy, z: end.z + oz };
    }

    /**
     * Bring the astronaut on screen right away unless it is already flying
     */
    summonAstronaut() {
        if (this.astronautExiled) return;
        if (this.astronaut && !this.astronautVisible) {
            this.startAstronautJourney();
        }
    }

    /**
     * The planet is dying. Fly out, and stay gone until life returns.
     */
    departAstronaut() {
        this.astronautExiled = true;
        this.astronautNextAppearanceTime = Number.POSITIVE_INFINITY;
        if (!this.astronaut || !this.astronautVisible) return;

        const pos = this.astronaut.position;
        const away = new THREE.Vector3(
            this.astronautEndPos.x - this.astronautStartPos.x,
            this.astronautEndPos.y - this.astronautStartPos.y,
            this.astronautEndPos.z - this.astronautStartPos.z
        );
        if (away.dot(pos) <= 0 || away.lengthSq() < 0.001) {
            away.set(pos.x, pos.y, pos.z);
        }
        if (away.lengthSq() < 1) away.set(8, 2, 6);
        away.normalize().multiplyScalar(48);
        const exit = pos.clone().add(away);

        this.astronautStartPos = { x: pos.x, y: pos.y, z: pos.z };
        this.astronautEndPos = { x: exit.x, y: exit.y, z: exit.z };
        this.astronautJourneyProgress = 0;
        this.astronautJourneySpeed = 0.0018;
        this.astronautFlight = 'departing';
        this.astronautJourneyStarted = true;
        this.astronaut.visible = true;
    }

    /**
     * Life is back. Cross the globe again.
     */
    recallAstronaut() {
        this.astronautExiled = false;
        if (!this.astronaut) return;

        if (!this.astronautVisible) {
            this.startAstronautJourney();
            this.astronautJourneySpeed = 0.0012;
            this.astronautFlight = 'returning';
            return;
        }

        const pos = this.astronaut.position;
        const inbound = new THREE.Vector3(-pos.x, -pos.y * 0.3, -pos.z);
        if (inbound.lengthSq() < 1) inbound.set(0, 1, 12);
        inbound.normalize().multiplyScalar(46);
        const end = pos.clone().add(inbound);

        this.astronautStartPos = { x: pos.x, y: pos.y, z: pos.z };
        this.astronautEndPos = { x: end.x, y: end.y, z: end.z };
        this.astronautJourneyProgress = 0;
        this.astronautJourneySpeed = 0.003;
        this.astronautFlight = 'returning';
        this.astronautJourneyStarted = true;
        this.astronaut.visible = true;
    }

    /**
     * The dead epoch was cancelled. Don't force a return; just allow the usual schedule.
     */
    releaseAstronaut() {
        const wasExiled = this.astronautExiled;
        this.astronautExiled = false;
        if (this.astronautFlight === 'departing') return;

        this.astronautFlight = 'normal';
        if (wasExiled && !this.astronautVisible) {
            this.astronautNextAppearanceTime = Date.now() + (30000 + Math.random() * 90000);
        }
    }

    /**
     * End astronaut journey
     */
    endAstronautJourney() {
        console.log('Astronaut journey complete, hiding for next appearance');

        this.astronaut.visible = false;
        this.astronautVisible = false;
        this.astronautJourneyStarted = false;
        this.astronautFlight = 'normal';
        this.jetpackThrusting = false;
        this.setThrusterIntensity(0);

        this.astronautNextAppearanceTime = this.astronautExiled
            ? Number.POSITIVE_INFINITY
            : Date.now() + (30000 + Math.random() * 90000);
    }

    /**
     * Drive thruster glow and lights. Lights stay enabled; only intensity changes.
     */
    updateJetpackThrust(currentTime: number) {
        if (!this.jetpackFlames) return;

        if (this.jetpackCycleStart === 0 || this.astronautFlight !== 'normal') {
            this.jetpackCycleStart = currentTime;
        }

        const cycleTime = currentTime - this.jetpackCycleStart;
        const totalCycleTime = this.jetpackThrustDuration + this.jetpackRestDuration;

        if (cycleTime >= totalCycleTime) {
            this.jetpackCycleStart = currentTime;
        }

        const currentCycleTime = currentTime - this.jetpackCycleStart;
        this.jetpackThrusting = currentCycleTime < this.jetpackThrustDuration;

        this.jetpackFlames.forEach((glowSphere, index) => {
            this.jetpackLights[index].position.copy(glowSphere.getWorldPosition(this.thrusterWorldPos));

            if (!this.jetpackThrusting) {
                glowSphere.material.opacity = 0;
                this.jetpackLights[index].intensity = 0;
                return;
            }

            const flicker = 0.6 + Math.sin(currentTime * 0.02 + index) * 0.3;
            glowSphere.scale.setScalar(1.0 + flicker * 0.8);
            const glow = 0.8 + Math.sin(currentTime * 0.015 + index * 2) * 0.2;
            glowSphere.material.color.setHSL(0.55, 1.0, glow);
            glowSphere.material.opacity = 0.8 + flicker * 0.2;

            const light = this.jetpackLights[index];
            const lightFlicker = 0.8 + Math.sin(currentTime * 0.02 + index) * 0.3;
            light.intensity = 1.0 + lightFlicker * 0.8;
            const hue = 0.55 + Math.sin(currentTime * 0.01 + index) * 0.05;
            light.color.setHSL(hue, 1.0, 0.8);
        });
    }

    setThrusterIntensity(intensity: number) {
        this.jetpackLights.forEach(light => {
            light.intensity = intensity;
        });
        this.jetpackFlames.forEach(glowSphere => {
            glowSphere.material.opacity = 0;
        });
    }

    /**
     * Update astronaut leg movements
     */
    updateAstronautLegs(currentTime) {
        if (!this.astronautLeftLeg || !this.astronautRightLeg || !this.astronautVisible) return;
        
        if (currentTime - this.lastLegMovement > this.legMovementInterval) {
            this.lastLegMovement = currentTime;
            this.legMovementTime = 0;
            this.legMovementInterval = 3000 + Math.random() * 4000;
        }
        
        this.legMovementTime += this.legMovementSpeed;
        
        const leftLegMovement = Math.sin(this.legMovementTime) * 0.3;
        const rightLegMovement = Math.sin(this.legMovementTime + Math.PI) * 0.3;
        
        const leftLegRotX = Math.sin(this.legMovementTime * 0.7) * 0.15;
        const rightLegRotX = Math.sin(this.legMovementTime * 0.7 + Math.PI) * 0.15;
        
        const leftLegRotZ = Math.sin(this.legMovementTime * 0.5) * 0.1;
        const rightLegRotZ = Math.sin(this.legMovementTime * 0.5 + Math.PI) * 0.1;
        
        const decay = Math.max(0, 1 - this.legMovementTime * 0.2);
        
        this.astronautLeftLeg.rotation.x = leftLegRotX * decay;
        this.astronautLeftLeg.rotation.z = leftLegRotZ * decay;
        this.astronautRightLeg.rotation.x = rightLegRotX * decay;
        this.astronautRightLeg.rotation.z = rightLegRotZ * decay;
        
        this.astronautLeftLeg.position.y = -0.12 + leftLegMovement * 0.02 * decay;
        this.astronautRightLeg.position.y = -0.12 + rightLegMovement * 0.02 * decay;
    }

    /**
     * Update shooting stars
     */
    updateShootingStars() {
        const currentTime = Date.now();
        
        if (currentTime - this.lastShootingStarTime > this.shootingStarCooldown && Math.random() < 0.05) {
            this.createShootingStar();
            this.lastShootingStarTime = currentTime;
            this.shootingStarCooldown = 1000 + Math.random() * 3000;
        }
        
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const shootingStar = this.shootingStars[i];
            
            shootingStar.star.position.add(shootingStar.velocity);
            
            const pos = shootingStar.star.position;
            const trailIndex = shootingStar.trailIndex % (shootingStar.trailPositions.length / 3);
            shootingStar.trailPositions[trailIndex * 3] = pos.x;
            shootingStar.trailPositions[trailIndex * 3 + 1] = pos.y;
            shootingStar.trailPositions[trailIndex * 3 + 2] = pos.z;
            shootingStar.trailIndex++;
            
            shootingStar.trail.geometry.attributes.position.needsUpdate = true;
            
            shootingStar.life -= 0.005;
            
            const alpha = shootingStar.life / shootingStar.maxLife;
            shootingStar.star.material.opacity = alpha * 1.0;
            shootingStar.trail.material.opacity = alpha * 0.9;
            
            if (shootingStar.life <= 0 || pos.length() > 100) {
                this.scene.remove(shootingStar.star);
                this.scene.remove(shootingStar.trail);
                shootingStar.star.geometry.dispose();
                shootingStar.star.material.dispose();
                shootingStar.trail.geometry.dispose();
                shootingStar.trail.material.dispose();
                this.shootingStars.splice(i, 1);
            }
        }
    }

    /**
     * Create a shooting star
     */
    createShootingStar() {
        const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 25;
        const startX = Math.cos(angle) * distance;
        const startZ = Math.sin(angle) * distance;
        const startY = (Math.random() - 0.5) * 15;
        
        star.position.set(startX, startY, startZ);
        
        const speed = 1.5 + Math.random() * 1.0;
        const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const velocity = new THREE.Vector3(
            Math.cos(targetAngle) * speed,
            (Math.random() - 0.5) * 0.5,
            Math.sin(targetAngle) * speed
        );
        
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions: number[] = [];
        const trailLength = 20;
        
        for (let i = 0; i < trailLength; i++) {
            trailPositions.push(startX, startY, startZ);
        }
        
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            linewidth: 3
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        
        const shootingStar = {
            star: star,
            trail: trail,
            velocity: velocity,
            life: 1.0,
            maxLife: 1.0,
            trailPositions: trailPositions,
            trailIndex: 0
        };
        
        this.scene.add(star);
        this.scene.add(trail);
        this.shootingStars.push(shootingStar);
    }

    /**
     * Update satellites
     */
    updateSatellites() {
        if (!this.satellites) return;

        this.satellites.forEach(satData => {
            satData.orbitAngle += satData.orbitSpeed * this.timeScale;

            const pos = this.satelliteOrbitPosition(
                satData.orbitRadius,
                satData.orbitAngle,
                satData.inclination,
                satData.raan
            );
            const ahead = this.satelliteOrbitPosition(
                satData.orbitRadius,
                satData.orbitAngle + 0.08,
                satData.inclination,
                satData.raan
            );

            satData.spin += satData.spinSpeed * this.timeScale;
            satData.group.position.set(pos.x, pos.y, pos.z);
            satData.group.lookAt(ahead.x, ahead.y, ahead.z);
            satData.group.rotateZ(satData.spin);
        });
    }

    /**
     * Get astronaut
     */
    getAstronaut() {
        return this.astronaut;
    }

    /**
     * Get shooting stars
     */
    getShootingStars() {
        return this.shootingStars;
    }

    /**
     * Get satellites
     */
    getSatellites() {
        return this.satellites;
    }

    /**
     * Destroy all easter eggs
     */
    destroy() {
        this.jetpackLights.forEach(light => {
            this.scene.remove(light);
            light.dispose();
        });
        this.jetpackLights = [];

        if (this.astronaut) {
            this.scene.remove(this.astronaut);
            this.astronaut.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }

        this.shootingStars.forEach(shootingStar => {
            this.scene.remove(shootingStar.star);
            this.scene.remove(shootingStar.trail);
            shootingStar.star.geometry.dispose();
            shootingStar.star.material.dispose();
            shootingStar.trail.geometry.dispose();
            shootingStar.trail.material.dispose();
        });

        this.satellites.forEach(satData => {
            this.scene.remove(satData.group);
            satData.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
    }
}
