import * as THREE from 'three';

/**
 * EasterEggs - Handles astronaut, shooting stars, and satellites
 */
export class EasterEggs {
    constructor(scene) {
        this.scene = scene;
        this.astronaut = null;
        this.shootingStars = [];
        this.satellites = [];
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
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.05, 0.15, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xf0f0f0,
            roughness: 0.4,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.astronaut.add(body);
        
        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.07, 16, 16);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.9
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 0.1;
        this.astronaut.add(helmet);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.02, 0.12, 4, 8);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.08, -0.02, 0);
        this.astronaut.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.08, -0.02, 0);
        this.astronaut.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.025, 0.1, 4, 8);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.03, -0.12, 0);
        this.astronaut.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.03, -0.12, 0);
        this.astronaut.add(rightLeg);
        
        // Store leg references for animation
        this.astronautLeftLeg = leftLeg;
        this.astronautRightLeg = rightLeg;
        
        // Backpack
        const backpackGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.04);
        const backpackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.3
        });
        const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
        backpack.position.set(0, 0.02, -0.08);
        this.astronaut.add(backpack);
        
        // Jetpack
        const jetpackGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.06);
        const jetpackMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            roughness: 0.4,
            metalness: 0.6
        });
        const jetpack = new THREE.Mesh(jetpackGeometry, jetpackMaterial);
        jetpack.position.set(0, 0.02, -0.12);
        this.astronaut.add(jetpack);
        
        // Jetpack thrusters
        const thrusterGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8);
        const thrusterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.8
        });
        
        const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        leftThruster.position.set(-0.025, -0.02, -0.15);
        leftThruster.rotation.x = Math.PI / 2;
        this.astronaut.add(leftThruster);
        
        const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        rightThruster.position.set(0.025, -0.02, -0.15);
        rightThruster.rotation.x = Math.PI / 2;
        this.astronaut.add(rightThruster);
        
        this.astronautThrusters = [leftThruster, rightThruster];
        this.createJetpackFlames();
        
        // Initialize astronaut state
        this.astronautVisible = false;
        this.astronautJourneyStarted = false;
        this.astronautNextAppearanceTime = Date.now() + (3000 + Math.random() * 5000);
        
        this.jetpackThrusting = false;
        this.jetpackThrustCycle = 0;
        this.jetpackThrustDuration = 2000;
        this.jetpackRestDuration = 1500;
        this.jetpackCycleStart = 0;
        this.jetpackFlames = [];
        
        this.legMovementTime = 0;
        this.legMovementSpeed = 0.003;
        this.lastLegMovement = 0;
        this.legMovementInterval = 3000 + Math.random() * 4000;
        
        this.astronaut.visible = false;
        this.astronaut.scale.setScalar(3.0);
        
        this.scene.add(this.astronaut);
        console.log('Astronaut created and added to orbit around Earth');
    }

    /**
     * Create jetpack flames
     */
    createJetpackFlames() {
        this.jetpackFlames = [];
        this.jetpackLights = [];
        
        for (let i = 0; i < this.astronautThrusters.length; i++) {
            const thruster = this.astronautThrusters[i];
            
            const thrustLight = new THREE.PointLight(0x00aaff, 0.8, 3);
            thrustLight.position.copy(thruster.position);
            thrustLight.position.z -= 0.05;
            thrustLight.visible = false;
            
            const glowGeometry = new THREE.SphereGeometry(0.01, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.9
            });
            
            const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
            glowSphere.position.copy(thrustLight.position);
            glowSphere.visible = false;
            
            this.astronaut.add(thrustLight);
            this.astronaut.add(glowSphere);
            this.jetpackLights.push(thrustLight);
            this.jetpackFlames.push(glowSphere);
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
     * Create satellites
     */
    createSatellites() {
        console.log('Creating satellites');
        
        this.satellites = [];
        
        for (let i = 0; i < 3; i++) {
            const satellite = new THREE.Group();
            
            // Main body
            const bodyGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.06);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            satellite.add(body);
            
            // Solar panels
            const panelGeometry = new THREE.BoxGeometry(0.08, 0.01, 0.06);
            const panelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x001133,
                metalness: 0.2,
                roughness: 0.8
            });
            
            const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            leftPanel.position.x = -0.06;
            satellite.add(leftPanel);
            
            const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            rightPanel.position.x = 0.06;
            satellite.add(rightPanel);
            
            // Antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.03, 4);
            const antennaMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                metalness: 0.9
            });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.y = 0.035;
            satellite.add(antenna);
            
            // Set orbit properties
            const orbitRadius = 5 + i * 1.5;
            const orbitSpeed = 0.001 + i * 0.0008;
            const orbitAngle = (i / 3) * Math.PI * 2;
            const orbitInclination = (Math.random() - 0.5) * Math.PI / 4;
            
            const satelliteData = {
                group: satellite,
                orbitRadius: orbitRadius,
                orbitSpeed: orbitSpeed,
                orbitAngle: orbitAngle,
                orbitInclination: orbitInclination,
                spinSpeed: 0.01 + Math.random() * 0.02
            };
            
            this.satellites.push(satelliteData);
            this.scene.add(satellite);
        }
        
        console.log('Satellites created:', this.satellites.length);
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
        
        if (!this.astronautVisible && currentTime > this.astronautNextAppearanceTime) {
            this.startAstronautJourney();
        }
        
        if (this.astronautJourneyStarted && this.astronautVisible) {
            this.updateJetpackThrust(currentTime);
            this.updateAstronautLegs(currentTime);
            
            let currentSpeed = this.astronautJourneySpeed;
            if (this.jetpackThrusting) {
                currentSpeed *= 2.5;
            } else {
                currentSpeed *= 0.5;
            }
            
            this.astronautJourneyProgress += currentSpeed;
            
            const t = this.astronautJourneyProgress;
            const x = this.astronautStartPos.x + (this.astronautEndPos.x - this.astronautStartPos.x) * t;
            const y = this.astronautStartPos.y + (this.astronautEndPos.y - this.astronautStartPos.y) * t;
            const z = this.astronautStartPos.z + (this.astronautEndPos.z - this.astronautStartPos.z) * t;
            
            const floatingY = y + Math.sin(currentTime * 0.001) * 0.05;
            this.astronaut.position.set(x, floatingY, z);
            
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
     * Start astronaut journey
     */
    startAstronautJourney() {
        console.log('🚀 Astronaut appearing for journey!');
        
        const direction = Math.random() < 0.5 ? -1 : 1;
        
        this.astronautStartPos = {
            x: direction * (20 + Math.random() * 5),
            y: (Math.random() - 0.5) * 8,
            z: (Math.random() - 0.5) * 4
        };
        
        this.astronautEndPos = {
            x: -direction * (20 + Math.random() * 5),
            y: this.astronautStartPos.y + (Math.random() - 0.5) * 3,
            z: this.astronautStartPos.z + (Math.random() - 0.5) * 2
        };
        
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
     * End astronaut journey
     */
    endAstronautJourney() {
        console.log('🌌 Astronaut journey complete, hiding for next appearance');
        
        this.astronaut.visible = false;
        this.astronautVisible = false;
        this.astronautJourneyStarted = false;
        
        this.astronautNextAppearanceTime = Date.now() + (30000 + Math.random() * 90000);
    }

    /**
     * Update jetpack thrust animation
     */
    updateJetpackThrust(currentTime) {
        if (!this.jetpackFlames) return;
        
        if (this.jetpackCycleStart === 0) {
            this.jetpackCycleStart = currentTime;
        }
        
        const cycleTime = currentTime - this.jetpackCycleStart;
        const totalCycleTime = this.jetpackThrustDuration + this.jetpackRestDuration;
        
        if (cycleTime >= totalCycleTime) {
            this.jetpackCycleStart = currentTime;
        }
        
        const currentCycleTime = currentTime - this.jetpackCycleStart;
        const wasThrusting = this.jetpackThrusting;
        
        if (currentCycleTime < this.jetpackThrustDuration) {
            this.jetpackThrusting = true;
            
            this.jetpackFlames.forEach((glowSphere, index) => {
                glowSphere.visible = true;
                const flicker = 0.6 + Math.sin(currentTime * 0.02 + index) * 0.3;
                glowSphere.scale.setScalar(1.0 + flicker * 0.8);
                const intensity = 0.8 + Math.sin(currentTime * 0.015 + index * 2) * 0.2;
                glowSphere.material.color.setHSL(0.55, 1.0, intensity);
                glowSphere.material.opacity = 0.8 + flicker * 0.2;
            });
            
            this.jetpackLights.forEach((light, index) => {
                light.visible = true;
                const flicker = 0.8 + Math.sin(currentTime * 0.02 + index) * 0.3;
                light.intensity = 1.0 + flicker * 0.8;
                const hue = 0.55 + Math.sin(currentTime * 0.01 + index) * 0.05;
                light.color.setHSL(hue, 1.0, 0.8);
            });
        } else {
            this.jetpackThrusting = false;
            
            this.jetpackFlames.forEach(glowSphere => {
                glowSphere.visible = false;
            });
            
            this.jetpackLights.forEach(light => {
                light.visible = false;
            });
        }
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
        const trailPositions = [];
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
            satData.orbitAngle += satData.orbitSpeed;
            
            const x = Math.cos(satData.orbitAngle) * satData.orbitRadius;
            const y = Math.sin(satData.orbitInclination) * Math.sin(satData.orbitAngle) * satData.orbitRadius * 0.3;
            const z = Math.sin(satData.orbitAngle) * satData.orbitRadius;
            
            satData.group.position.set(x, y, z);
            satData.group.rotation.y += satData.spinSpeed;
            
            satData.group.lookAt(
                x + Math.cos(satData.orbitAngle + Math.PI/2),
                y,
                z + Math.sin(satData.orbitAngle + Math.PI/2)
            );
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
