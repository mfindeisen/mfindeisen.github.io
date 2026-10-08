import * as THREE from 'three';

type ShootingStar = {
    star: THREE.Mesh;
    trail: THREE.Line;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    trailPositions: number[];
    trailIndex: number;
};

export class ShootingStars {
    scene: THREE.Scene;
    items: ShootingStar[];
    lastTime: number;
    cooldown: number;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.items = [];
        this.lastTime = 0;
        this.cooldown = 15000;
    }

    update() {
        const currentTime = Date.now();

        if (currentTime - this.lastTime > this.cooldown && Math.random() < 0.05) {
            this.spawn();
            this.lastTime = currentTime;
            this.cooldown = 1000 + Math.random() * 3000;
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const shootingStar = this.items[i];
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
            (shootingStar.star.material as THREE.MeshBasicMaterial).opacity = alpha;
            (shootingStar.trail.material as THREE.LineBasicMaterial).opacity = alpha * 0.9;

            if (shootingStar.life <= 0 || pos.length() > 100) {
                this.removeAt(i);
            }
        }
    }

    spawn() {
        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
        );

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

        const trailPositions: number[] = [];
        for (let i = 0; i < 20; i++) {
            trailPositions.push(startX, startY, startZ);
        }
        const trailGeometry = new THREE.BufferGeometry();
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
        const trail = new THREE.Line(
            trailGeometry,
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
        );

        this.scene.add(star);
        this.scene.add(trail);
        this.items.push({
            star,
            trail,
            velocity,
            life: 1,
            maxLife: 1,
            trailPositions,
            trailIndex: 0
        });
    }

    removeAt(index: number) {
        const shootingStar = this.items[index];
        this.scene.remove(shootingStar.star);
        this.scene.remove(shootingStar.trail);
        shootingStar.star.geometry.dispose();
        (shootingStar.star.material as THREE.Material).dispose();
        shootingStar.trail.geometry.dispose();
        (shootingStar.trail.material as THREE.Material).dispose();
        this.items.splice(index, 1);
    }

    destroy() {
        while (this.items.length) this.removeAt(this.items.length - 1);
    }
}
