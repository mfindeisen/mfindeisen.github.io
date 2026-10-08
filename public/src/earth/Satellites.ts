import * as THREE from 'three';

type Satellite = {
    group: THREE.Group;
    orbitRadius: number;
    orbitSpeed: number;
    orbitAngle: number;
    inclination: number;
    raan: number;
    spin: number;
    spinSpeed: number;
};

/**
 * Satellites on varied, real-world-inspired orbital planes
 * (equatorial, inclined / GPS-like, polar, sun-synchronous).
 */
export class Satellites {
    scene: THREE.Scene;
    items: Satellite[];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.items = [];
        this.create();
    }

    create() {
        // Radii vs Earth R=2.5: LEO ~1.2–1.4R, MEO compressed ~3–4R, GEO-ish ~4–5R
        // (true GEO is ~6.6R / 16.5 — too far to read, so outer band stays ~8–12)
        const orbitProfiles = [
            { inclinationDeg: 0, radius: 10.5, speed: 0.00032 },
            { inclinationDeg: 0, radius: 11.8, speed: 0.00028 },
            { inclinationDeg: 28, radius: 3.2, speed: 0.0018 },
            { inclinationDeg: 51.6, radius: 3.05, speed: 0.0020 },
            { inclinationDeg: 55, radius: 8.5, speed: 0.00055 },
            { inclinationDeg: 55, radius: 9.2, speed: 0.00050 },
            { inclinationDeg: 63.4, radius: 7.8, speed: 0.00062 },
            { inclinationDeg: 90, radius: 3.15, speed: 0.0019 },
            { inclinationDeg: 90, radius: 3.4, speed: 0.0017 },
            { inclinationDeg: 98, radius: 3.25, speed: 0.00185 },
            { inclinationDeg: 98, radius: 3.5, speed: 0.00165 },
            { inclinationDeg: 70, radius: 8.0, speed: 0.00058 }
        ];

        for (let i = 0; i < orbitProfiles.length; i++) {
            const profile = orbitProfiles[i];
            const satellite = new THREE.Group();
            const scale = 0.75 + Math.random() * 0.55;

            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.7,
                roughness: 0.3
            });
            satellite.add(new THREE.Mesh(
                new THREE.BoxGeometry(0.04 * scale, 0.04 * scale, 0.06 * scale),
                bodyMaterial
            ));

            const panelMaterial = new THREE.MeshStandardMaterial({
                color: 0x001133,
                metalness: 0.2,
                roughness: 0.8
            });
            const panelGeometry = new THREE.BoxGeometry(0.08 * scale, 0.01 * scale, 0.06 * scale);
            const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            leftPanel.position.x = -0.06 * scale;
            satellite.add(leftPanel);
            const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            rightPanel.position.x = 0.06 * scale;
            satellite.add(rightPanel);

            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(0.001 * scale, 0.001 * scale, 0.03 * scale, 4),
                new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 })
            );
            antenna.position.y = 0.035 * scale;
            satellite.add(antenna);

            this.items.push({
                group: satellite,
                orbitRadius: profile.radius + (Math.random() - 0.5) * 0.25,
                orbitSpeed: profile.speed * (0.9 + Math.random() * 0.2),
                orbitAngle: Math.random() * Math.PI * 2,
                inclination: profile.inclinationDeg * Math.PI / 180,
                raan: (i / orbitProfiles.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.35,
                spin: Math.random() * Math.PI * 2,
                spinSpeed: 0.0015 + Math.random() * 0.003
            });
            this.scene.add(satellite);
        }
    }

    orbitPosition(radius: number, angle: number, inclination: number, raan: number) {
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

    update(timeScale: number) {
        this.items.forEach(sat => {
            sat.orbitAngle += sat.orbitSpeed * timeScale;
            const pos = this.orbitPosition(sat.orbitRadius, sat.orbitAngle, sat.inclination, sat.raan);
            const ahead = this.orbitPosition(sat.orbitRadius, sat.orbitAngle + 0.08, sat.inclination, sat.raan);
            sat.spin += sat.spinSpeed * timeScale;
            sat.group.position.set(pos.x, pos.y, pos.z);
            sat.group.lookAt(ahead.x, ahead.y, ahead.z);
            sat.group.rotateZ(sat.spin);
        });
    }

    destroy() {
        this.items.forEach(sat => {
            this.scene.remove(sat.group);
            sat.group.traverse((child: any) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.items = [];
    }
}
