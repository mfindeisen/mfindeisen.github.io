import * as THREE from 'three';

/**
 * EVA astronaut on a flyby past Earth.
 */
export class Astronaut {
    scene: THREE.Scene;
    group: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    thrusters: THREE.Mesh[];
    visible: boolean;
    journeyStarted: boolean;
    nextAppearanceTime: number;
    exiled: boolean;
    flight: 'normal' | 'departing' | 'returning';
    jetpackThrusting: boolean;
    jetpackThrustDuration: number;
    jetpackRestDuration: number;
    jetpackCycleStart: number;
    jetpackFlames: THREE.Mesh[];
    jetpackLights: THREE.PointLight[];
    legMovementTime: number;
    legMovementSpeed: number;
    lastLegMovement: number;
    legMovementInterval: number;
    journeySpeed: number;
    journeyProgress: number;
    startPos: { x: number; y: number; z: number } | null;
    endPos: { x: number; y: number; z: number } | null;
    boost: number;
    thrusterWorldPos: THREE.Vector3;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.leftLeg = new THREE.Group();
        this.rightLeg = new THREE.Group();
        this.thrusters = [];
        this.visible = false;
        this.journeyStarted = false;
        this.nextAppearanceTime = 0;
        this.exiled = false;
        this.flight = 'normal';
        this.jetpackThrusting = false;
        this.jetpackThrustDuration = 2000;
        this.jetpackRestDuration = 1500;
        this.jetpackCycleStart = 0;
        this.jetpackFlames = [];
        this.jetpackLights = [];
        this.legMovementTime = 0;
        this.legMovementSpeed = 0.003;
        this.lastLegMovement = 0;
        this.legMovementInterval = 3000 + Math.random() * 4000;
        this.journeySpeed = 0;
        this.journeyProgress = 0;
        this.startPos = null;
        this.endPos = null;
        this.boost = 1;
        this.thrusterWorldPos = new THREE.Vector3();

        this.create();
    }

    addLimb(start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
        const dir = new THREE.Vector3().subVectors(end, start);
        const length = dir.length();
        const mesh = new THREE.Mesh(
            new THREE.CapsuleGeometry(radius, Math.max(0.01, length - radius * 1.6), 4, 8),
            material
        );
        mesh.position.copy(start).add(end).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        this.group.add(mesh);
        return mesh;
    }

    create() {
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
        // Gold visor lit by the scene sun/hemi — no emissive, so night side stays dark
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0xc9a227,
            roughness: 0.28,
            metalness: 0.38
        });

        this.group.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), suitMaterial));

        const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), accentMaterial);
        chestStripe.position.set(0, -0.025, 0.048);
        this.group.add(chestStripe);

        const control = new THREE.Group();
        control.position.set(0, 0.018, 0.09);
        this.group.add(control);
        control.add(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.038, 0.03), suitMaterial));
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
        this.group.add(helmet);

        const visor = new THREE.Mesh(
            new THREE.SphereGeometry(helmetRadius * 1.045, 20, 14, 0, Math.PI),
            visorMaterial
        );
        visor.position.set(0, helmetY, 0.006);
        visor.scale.set(1, 1, 1.12);
        this.group.add(visor);

        const visorRim = new THREE.Mesh(new THREE.TorusGeometry(helmetRadius * 0.99, 0.006, 8, 24), darkMaterial);
        visorRim.position.set(0, helmetY, 0.004);
        this.group.add(visorRim);

        const helmetRim = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 16), darkMaterial);
        helmetRim.position.y = 0.068;
        helmetRim.rotation.x = Math.PI / 2;
        this.group.add(helmetRim);

        this.addLimb(new THREE.Vector3(-0.055, 0.055, 0.02), new THREE.Vector3(-0.09, 0.02, 0.055), 0.017, suitMaterial);
        this.addLimb(new THREE.Vector3(-0.09, 0.02, 0.055), new THREE.Vector3(-0.06, 0.018, 0.125), 0.016, suitMaterial);
        this.addLimb(new THREE.Vector3(0.055, 0.055, 0.02), new THREE.Vector3(0.09, 0.02, 0.055), 0.017, suitMaterial);
        this.addLimb(new THREE.Vector3(0.09, 0.02, 0.055), new THREE.Vector3(0.06, 0.018, 0.125), 0.016, suitMaterial);

        const gloveGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const leftGlove = new THREE.Mesh(gloveGeometry, suitMaterial);
        leftGlove.position.set(-0.06, 0.018, 0.125);
        this.group.add(leftGlove);
        const rightGlove = new THREE.Mesh(gloveGeometry, suitMaterial);
        rightGlove.position.set(0.06, 0.018, 0.125);
        this.group.add(rightGlove);

        const legGeometry = new THREE.CapsuleGeometry(0.024, 0.09, 4, 8);
        const bootGeometry = new THREE.SphereGeometry(0.028, 8, 8);

        this.leftLeg.position.set(-0.03, -0.12, 0);
        this.leftLeg.add(new THREE.Mesh(legGeometry, suitMaterial));
        const leftBoot = new THREE.Mesh(bootGeometry, darkMaterial);
        leftBoot.position.y = -0.07;
        this.leftLeg.add(leftBoot);
        this.group.add(this.leftLeg);

        this.rightLeg.position.set(0.03, -0.12, 0);
        this.rightLeg.add(new THREE.Mesh(legGeometry, suitMaterial));
        const rightBoot = new THREE.Mesh(bootGeometry, darkMaterial);
        rightBoot.position.y = -0.07;
        this.rightLeg.add(rightBoot);
        this.group.add(this.rightLeg);

        const pack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.055), packMaterial);
        pack.position.set(0, 0.02, -0.085);
        this.group.add(pack);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 6), darkMaterial);
        antenna.position.set(0.03, 0.1, -0.085);
        this.group.add(antenna);

        const thrusterGeometry = new THREE.CylinderGeometry(0.014, 0.018, 0.032, 8);
        const leftThruster = new THREE.Mesh(thrusterGeometry, darkMaterial);
        leftThruster.position.set(-0.028, -0.03, -0.12);
        leftThruster.rotation.x = Math.PI / 2;
        this.group.add(leftThruster);
        const rightThruster = new THREE.Mesh(thrusterGeometry, darkMaterial);
        rightThruster.position.set(0.028, -0.03, -0.12);
        rightThruster.rotation.x = Math.PI / 2;
        this.group.add(rightThruster);
        this.thrusters = [leftThruster, rightThruster];

        this.nextAppearanceTime = Date.now() + (3000 + Math.random() * 5000);
        this.createJetpackFlames();
        this.group.visible = false;
        this.group.scale.setScalar(3.0);
        this.scene.add(this.group);
    }

    createJetpackFlames() {
        this.jetpackFlames = [];
        this.jetpackLights = [];

        for (const thruster of this.thrusters) {
            const glowSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.01, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0 })
            );
            glowSphere.position.copy(thruster.position);
            glowSphere.position.z -= 0.05;
            this.group.add(glowSphere);
            this.jetpackFlames.push(glowSphere);

            const thrustLight = new THREE.PointLight(0x00aaff, 0, 3);
            this.scene.add(thrustLight);
            this.jetpackLights.push(thrustLight);
        }
    }

    update(timeScale: number) {
        if (this.exiled && !this.visible) return;

        const currentTime = Date.now();
        if (!this.exiled && !this.visible && currentTime > this.nextAppearanceTime) {
            this.startJourney();
        }

        if (!(this.journeyStarted && this.visible) || !this.startPos || !this.endPos) return;

        this.updateJetpackThrust(currentTime);
        this.updateLegs(currentTime);

        let currentSpeed: number;
        if (this.flight === 'departing') {
            currentSpeed = this.journeySpeed;
        } else {
            const scale = this.flight === 'returning' ? Math.max(timeScale, 1) : timeScale;
            currentSpeed = this.journeySpeed * this.boost * scale;
            currentSpeed *= this.jetpackThrusting ? 2.5 : 0.5;
        }

        this.journeyProgress += currentSpeed;
        const t = this.journeyProgress;
        this.group.position.set(
            this.startPos.x + (this.endPos.x - this.startPos.x) * t,
            this.startPos.y + (this.endPos.y - this.startPos.y) * t + Math.sin(currentTime * 0.001) * 0.05,
            this.startPos.z + (this.endPos.z - this.startPos.z) * t
        );

        const direction = new THREE.Vector3(
            this.endPos.x - this.startPos.x,
            this.endPos.y - this.startPos.y,
            this.endPos.z - this.startPos.z
        ).normalize();
        this.group.lookAt(
            this.group.position.x + direction.x,
            this.group.position.y + direction.y,
            this.group.position.z + direction.z
        );

        if (this.journeyProgress >= 1) this.endJourney();
    }

    startJourney() {
        const direction = Math.random() < 0.5 ? -1 : 1;
        const earthRadius = 2.5;
        const clearance = 1.2 + Math.random() * 1.4;
        const startX = direction * (20 + Math.random() * 5);
        const endX = -direction * (20 + Math.random() * 5);
        const style = Math.floor(Math.random() * 5);
        let startY: number;
        let startZ: number;
        let endY: number;
        let endZ: number;

        if (style === 0) {
            const z = earthRadius + clearance;
            startY = (Math.random() - 0.5) * 5;
            endY = startY + (Math.random() - 0.5) * 3;
            startZ = z;
            endZ = z + (Math.random() - 0.5) * 1.2;
        } else if (style === 1) {
            const z = -(earthRadius + clearance);
            startY = (Math.random() - 0.5) * 5;
            endY = startY + (Math.random() - 0.5) * 3;
            startZ = z;
            endZ = z + (Math.random() - 0.5) * 1.2;
        } else if (style === 2) {
            const y = earthRadius + clearance;
            startY = y;
            endY = y + (Math.random() - 0.5) * 1.5;
            startZ = (Math.random() - 0.5) * 4;
            endZ = startZ + (Math.random() - 0.5) * 2;
        } else if (style === 3) {
            const y = -(earthRadius + clearance);
            startY = y;
            endY = y + (Math.random() - 0.5) * 1.5;
            startZ = (Math.random() - 0.5) * 4;
            endZ = startZ + (Math.random() - 0.5) * 2;
        } else {
            const ySign = Math.random() < 0.5 ? 1 : -1;
            const zSign = Math.random() < 0.5 ? 1 : -1;
            startY = ySign * (2 + Math.random() * 4);
            endY = ySign * (2 + Math.random() * 4) * (Math.random() < 0.4 ? -1 : 1);
            startZ = zSign * (2 + Math.random() * 3);
            endZ = zSign * (2 + Math.random() * 3) * (Math.random() < 0.4 ? -1 : 1);
        }

        this.startPos = { x: startX, y: startY, z: startZ };
        this.endPos = { x: endX, y: endY, z: endZ };
        this.ensureFlybyClearsEarth(earthRadius + 1.0);
        this.journeyProgress = 0;
        this.journeySpeed = 0.0005 + Math.random() * 0.0003;
        this.journeyStarted = true;
        this.visible = true;
        this.group.position.set(this.startPos.x, this.startPos.y, this.startPos.z);
        this.group.visible = true;
    }

    ensureFlybyClearsEarth(minDistance: number) {
        const start = this.startPos;
        const end = this.endPos;
        if (!start || !end) return;
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

        let ox = 0;
        let oy = 0;
        let oz = 0;
        if (dist > 1e-4) {
            const push = (minDistance - dist) / dist;
            ox = cx * push;
            oy = cy * push;
            oz = cz * push;
        } else {
            const angle = Math.random() * Math.PI * 2;
            oy = Math.cos(angle) * minDistance;
            oz = Math.sin(angle) * minDistance;
        }

        this.startPos = { x: start.x + ox, y: start.y + oy, z: start.z + oz };
        this.endPos = { x: end.x + ox, y: end.y + oy, z: end.z + oz };
    }

    summon() {
        if (this.exiled) return;
        if (!this.visible) this.startJourney();
    }

    depart() {
        this.exiled = true;
        this.nextAppearanceTime = Number.POSITIVE_INFINITY;
        if (!this.visible || !this.startPos || !this.endPos) return;

        const pos = this.group.position;
        const away = new THREE.Vector3(
            this.endPos.x - this.startPos.x,
            this.endPos.y - this.startPos.y,
            this.endPos.z - this.startPos.z
        );
        if (away.dot(pos) <= 0 || away.lengthSq() < 0.001) {
            away.set(pos.x, pos.y, pos.z);
        }
        if (away.lengthSq() < 1) away.set(8, 2, 6);
        away.normalize().multiplyScalar(48);
        const exit = pos.clone().add(away);

        this.startPos = { x: pos.x, y: pos.y, z: pos.z };
        this.endPos = { x: exit.x, y: exit.y, z: exit.z };
        this.journeyProgress = 0;
        this.journeySpeed = 0.0018;
        this.flight = 'departing';
        this.journeyStarted = true;
        this.group.visible = true;
    }

    recall() {
        this.exiled = false;
        if (!this.visible) {
            this.startJourney();
            this.journeySpeed = 0.0012;
            this.flight = 'returning';
            return;
        }

        const pos = this.group.position;
        const inbound = new THREE.Vector3(-pos.x, -pos.y * 0.3, -pos.z);
        if (inbound.lengthSq() < 1) inbound.set(0, 1, 12);
        inbound.normalize().multiplyScalar(46);
        const end = pos.clone().add(inbound);

        this.startPos = { x: pos.x, y: pos.y, z: pos.z };
        this.endPos = { x: end.x, y: end.y, z: end.z };
        this.journeyProgress = 0;
        this.journeySpeed = 0.003;
        this.flight = 'returning';
        this.journeyStarted = true;
        this.group.visible = true;
    }

    release() {
        const wasExiled = this.exiled;
        this.exiled = false;
        if (this.flight === 'departing') return;
        this.flight = 'normal';
        if (wasExiled && !this.visible) {
            this.nextAppearanceTime = Date.now() + (30000 + Math.random() * 90000);
        }
    }

    endJourney() {
        this.group.visible = false;
        this.visible = false;
        this.journeyStarted = false;
        this.flight = 'normal';
        this.jetpackThrusting = false;
        this.setThrusterIntensity(0);
        this.nextAppearanceTime = this.exiled
            ? Number.POSITIVE_INFINITY
            : Date.now() + (30000 + Math.random() * 90000);
    }

    updateJetpackThrust(currentTime: number) {
        if (this.jetpackCycleStart === 0 || this.flight !== 'normal') {
            this.jetpackCycleStart = currentTime;
        }

        const totalCycleTime = this.jetpackThrustDuration + this.jetpackRestDuration;
        if (currentTime - this.jetpackCycleStart >= totalCycleTime) {
            this.jetpackCycleStart = currentTime;
        }

        this.jetpackThrusting = currentTime - this.jetpackCycleStart < this.jetpackThrustDuration;

        this.jetpackFlames.forEach((glowSphere, index) => {
            this.jetpackLights[index].position.copy(glowSphere.getWorldPosition(this.thrusterWorldPos));

            if (!this.jetpackThrusting) {
                (glowSphere.material as THREE.MeshBasicMaterial).opacity = 0;
                this.jetpackLights[index].intensity = 0;
                return;
            }

            const flicker = 0.6 + Math.sin(currentTime * 0.02 + index) * 0.3;
            glowSphere.scale.setScalar(1.0 + flicker * 0.8);
            const glow = 0.8 + Math.sin(currentTime * 0.015 + index * 2) * 0.2;
            (glowSphere.material as THREE.MeshBasicMaterial).color.setHSL(0.55, 1.0, glow);
            (glowSphere.material as THREE.MeshBasicMaterial).opacity = 0.8 + flicker * 0.2;

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
            (glowSphere.material as THREE.MeshBasicMaterial).opacity = 0;
        });
    }

    updateLegs(currentTime: number) {
        if (!this.visible) return;

        if (currentTime - this.lastLegMovement > this.legMovementInterval) {
            this.lastLegMovement = currentTime;
            this.legMovementTime = 0;
            this.legMovementInterval = 3000 + Math.random() * 4000;
        }

        this.legMovementTime += this.legMovementSpeed;
        const decay = Math.max(0, 1 - this.legMovementTime * 0.2);
        const left = Math.sin(this.legMovementTime);
        const right = Math.sin(this.legMovementTime + Math.PI);

        this.leftLeg.rotation.x = Math.sin(this.legMovementTime * 0.7) * 0.15 * decay;
        this.leftLeg.rotation.z = Math.sin(this.legMovementTime * 0.5) * 0.1 * decay;
        this.rightLeg.rotation.x = Math.sin(this.legMovementTime * 0.7 + Math.PI) * 0.15 * decay;
        this.rightLeg.rotation.z = Math.sin(this.legMovementTime * 0.5 + Math.PI) * 0.1 * decay;
        this.leftLeg.position.y = -0.12 + left * 0.02 * decay;
        this.rightLeg.position.y = -0.12 + right * 0.02 * decay;
    }

    destroy() {
        this.jetpackLights.forEach(light => {
            this.scene.remove(light);
            light.dispose();
        });
        this.jetpackLights = [];
        this.scene.remove(this.group);
        this.group.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}
