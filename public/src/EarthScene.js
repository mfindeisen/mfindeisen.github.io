import * as THREE from '/three/build/three.module.js';

// Three.js Scene Setup
let scene, camera, renderer;
let spherePlane;
let scrollProgress = 1; // 1 = sphere, 0 = flat
let isScrolling = false;
let scrollTimeout;
let hasStartedMorphing = false; // Track if user has ever started morphing

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x404040);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Color space (r160+)
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // IMPORTANT: disable shadows to avoid self-shadowing banding
  renderer.shadowMap.enabled = false;

  document.body.appendChild(renderer.domElement);

  createMorphingGeometry();
  createLighting();
  animate();
  setupEventListeners();
  hideLoading();
}

// Lighting
function createLighting() {
  // Hemisphere light for natural sky/ground ambient
  const hemi = new THREE.HemisphereLight(0x8fb3ff, 0x0b0b1a, 0.15);
  scene.add(hemi);

  // Additional ambient light for flat plane visibility
  const ambient = new THREE.AmbientLight(0x404040, 0.0); // Start at 0, will increase during morphing
  scene.add(ambient);

  // Sun from the right/front a bit above
  const sun = new THREE.DirectionalLight(0xffffff, 6.0);
  sun.position.set(40, 5, 10);
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target);

  // Keep these around for quick console tweaksY
  window.sunLight = sun;
  window.hemiLight = hemi;
  window.ambientLight = ambient;
}

// Realistic atmosphere shader (inspired by DAT.Globe)
function createAtmosphere() {
  // Atmosphere shader
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
      intensity = max(intensity, 0.0); // Ensure positive values
      gl_FragColor = vec4( 0.3, 0.6, 1.0, 0.4 ) * intensity; // Reduced alpha and intensity
    }
  `;

  // Create atmosphere geometry - thin atmospheric layer
  const atmosphereGeom = new THREE.SphereGeometry(2.6, 32, 32); // Thin atmosphere, just slightly larger than Earth
  
  console.log('Atmosphere geometry created:', atmosphereGeom);
  console.log('Atmosphere geometry vertices:', atmosphereGeom.attributes.position.count);

  // Create atmosphere material - enhanced shader-based effect
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  // Create atmosphere mesh
  window.atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
  window.atmosphere.rotation.z = THREE.MathUtils.degToRad(23.5); // Same tilt as Earth
  
  // Position atmosphere at origin with no additional scaling
  window.atmosphere.position.set(0, 0, 0);
  // No additional scaling - atmosphere size is controlled by geometry radius
  
  scene.add(window.atmosphere);

  console.log('Atmosphere created with MeshBasicMaterial');
  console.log('Atmosphere material opacity:', atmosphereMaterial.opacity);
  console.log('Atmosphere material color:', atmosphereMaterial.color);
  console.log('Atmosphere material side:', atmosphereMaterial.side);
  console.log('Atmosphere position:', window.atmosphere.position);
  console.log('Atmosphere scale:', window.atmosphere.scale);
  console.log('Atmosphere visible:', window.atmosphere.visible);
  console.log('Atmosphere in scene:', scene.children.includes(window.atmosphere));
}

// Geometry + morph targets
function createMorphingGeometry() {
  // more segments => smoother normals/lighting on the sphere
  const segW = 128, segH = 64;
  const planeGeom = new THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

  planeGeom.morphAttributes.position = [];
  planeGeom.morphAttributes.normal = [];

  const sphereFormation = [];
  const sphereNormals = [];

  const uvs = planeGeom.attributes.uv;
  const uv = new THREE.Vector2();
  const t = new THREE.Vector3();

  for (let i = 0; i < uvs.count; i++) {
    uv.fromBufferAttribute(uvs, i);

    // equirectangular sphere from UVs
    t.setFromSphericalCoords(
      2.5,                                   // radius
      Math.PI * (1 - uv.y),                  // polar
      Math.PI * (uv.x - 0.5) * 2             // azimuth
    );

    sphereFormation.push(t.x, t.y, t.z);

    // normal = normalized position on perfect sphere
    const len = Math.hypot(t.x, t.y, t.z) || 1;
    sphereNormals.push(t.x / len, t.y / len, t.z / len);
  }

  planeGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(sphereFormation, 3);
  planeGeom.morphAttributes.normal[0]   = new THREE.Float32BufferAttribute(sphereNormals, 3);

  // Texture
  const loader = new THREE.TextureLoader();
  const earthTexture = loader.load(
    '/textures/world.topo.bathy.200407.3x5400x2700.jpg',
    () => console.log('Texture loaded'),
    undefined,
    (e) => console.error('Texture load error', e)
  );
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.minFilter = THREE.LinearMipmapLinearFilter;
  earthTexture.magFilter = THREE.LinearFilter;
  earthTexture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy?.() || 8);

  // Material: PBR, per-fragment lighting, no specular shine
  // Note: morphTargets and morphNormals are automatically enabled when geometry has morph attributes
  const mat = new THREE.MeshStandardMaterial({
    map: earthTexture,
    side: THREE.DoubleSide,   // FrontSide avoids weird backface lighting
    metalness: 0,
    roughness: 0.35
  });

   spherePlane = new THREE.Mesh(planeGeom, mat);
   // no cast/receive shadows -> no banding from shadow map
   spherePlane.castShadow = false;
   spherePlane.receiveShadow = false;
 
   // Apply Earth's natural tilt (23.5 degrees)
   spherePlane.rotation.z = THREE.MathUtils.degToRad(23.5);
 
   // start as globe
   spherePlane.morphTargetInfluences[0] = 1;
   scene.add(spherePlane);

   // Create realistic atmosphere
   createAtmosphere();
}

// Render loop
function animate() {
  if (spherePlane?.morphTargetInfluences) {
     spherePlane.morphTargetInfluences[0] = scrollProgress;
     
     // Update atmosphere visibility based on scroll progress
     if (window.atmosphere) {
       // For shader material, we control opacity through uniforms
       // The shader naturally creates the atmospheric effect
       
       // Sync atmosphere rotation with Earth
       window.atmosphere.rotation.y = spherePlane.rotation.y;
       window.atmosphere.rotation.z = spherePlane.rotation.z;
     }
     
     // Natural Earth rotation: west to east (positive Y rotation)
     // Rotate when: not scrolling AND (never morphed OR back to full globe)
     const shouldRotate = !isScrolling && (!hasStartedMorphing || scrollProgress === 1);
     if (shouldRotate) {
       // Earth rotates 360° in 24 hours = 15°/hour = 0.25°/minute = ~0.004°/second
       // Speed it up for visual effect: 0.5° per second
       spherePlane.rotation.y += THREE.MathUtils.degToRad(0.5);
     } else if (isScrolling) {
       // When scrolling, increase ambient lights to keep plane visible
       // As it flattens (scrollProgress decreases), increase ambient light significantly
       if (window.hemiLight && window.ambientLight) {
         const t = 1 - scrollProgress; // 0 = sphere, 1 = flat
         // Hemisphere light: moderate increase
         const hemiIntensity = 0.06 + t * 0.4; // 0.06 to 0.46
         window.hemiLight.intensity = hemiIntensity;
         
         // Pure ambient light: strong increase for flat visibility
         const ambientIntensity = t * 0.6; // 0.0 to 0.6
         window.ambientLight.intensity = ambientIntensity;
       }
       
       // Gradually reduce tilt when morphing starts
       // scrollProgress: 1 = globe (keep tilt), 0 = flat (no tilt)
       const targetTilt = scrollProgress * THREE.MathUtils.degToRad(23.5);
       spherePlane.rotation.z = targetTilt;
     }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Events
function setupEventListeners() {
  window.addEventListener('resize', onWindowResize, { passive: true });
  window.addEventListener('wheel', onScroll, { passive: false });
  window.addEventListener('scroll', onPageScroll, { passive: true });
  window.addEventListener('keydown', onKeyDown);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

 function onScroll(e) {
   e.preventDefault();
   
   // Mark that user has started morphing - rotation will never resume
   hasStartedMorphing = true;
   
   // Set scrolling flag to pause rotation
   isScrolling = true;
   
   // Clear existing timeout
   clearTimeout(scrollTimeout);
   
   // End scrolling state after 1 second, but don't resume rotation
   scrollTimeout = setTimeout(() => {
     isScrolling = false;
     // Reset ambient lights to original intensity when scrolling stops
     if (window.hemiLight) {
       window.hemiLight.intensity = 0.06;
     }
     if (window.ambientLight) {
       window.ambientLight.intensity = 0.0;
     }
     // Reset tilt when back to globe
     if (scrollProgress === 1) {
       if (spherePlane) {
         spherePlane.rotation.z = THREE.MathUtils.degToRad(23.5);
       }
     }
   }, 1000);
   
   const delta = e.deltaY * 0.001;
   scrollProgress = Math.max(0, Math.min(1, scrollProgress - delta));
   updateProgressIndicator();
 }

function onPageScroll(_) {}
function onKeyDown(e) {
  switch (e.code) {
    case 'KeyR':
      camera.position.set(0, 0, 10);
      scrollProgress = 1;
      hasStartedMorphing = false; // Allow rotation to resume after reset
      // Reset lights
      if (window.hemiLight) window.hemiLight.intensity = 0.06;
      if (window.ambientLight) window.ambientLight.intensity = 0.0;
      updateProgressIndicator();
      break;
    case 'KeyI':
      toggleInfoPanel();
      break;
    case 'Space':
      e.preventDefault();
      scrollProgress = scrollProgress > 0.5 ? 0 : 1;
      updateProgressIndicator();
      break;
  }
}

// UI helpers (unchanged)
function showLoading(){ const el = document.querySelector('.loading'); if (el) el.style.display='block'; }
function hideLoading(){ const el = document.querySelector('.loading'); if (el) el.style.display='none'; }
function toggleInfoPanel(){ const el = document.querySelector('.info-panel'); if (el) el.classList.toggle('hidden'); }
function updateProgressIndicator(){
  const bar = document.querySelector('.progress-bar-fill');
  const txt = document.querySelector('.progress-text');
  if (bar) bar.style.width = (scrollProgress * 100) + '%';
  if (txt) txt.textContent = `${Math.round(scrollProgress * 100)}%`;
}

// Export for compatibility with existing code that might import EarthScene
export class EarthScene {
    constructor() {
    this.isInitialized = false;
    // Don't auto-initialize since main.js will handle the rendering
        this.init();
    }

    init() {
    if (this.isInitialized) return;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 0, 15);

    // Don't create renderer here - main.js creates its own
    this.createStarfield();
    this.createMorphingGeometry();
    this.createLighting();
    this.createAtmosphere();
    this.createAstronaut();
    this.createShootingStars();
    this.createSatellites();
    
    this.isInitialized = true;
    console.log('EarthScene initialized for external use');
  }
  
  createLighting() {
    // Hemisphere light for natural sky/ground ambient
    const hemi = new THREE.HemisphereLight(0x8fb3ff, 0x0b0b1a, 0.06);
    this.scene.add(hemi);

    // Additional ambient light for flat plane visibility
    const ambient = new THREE.AmbientLight(0x404040, 0.0);
    this.scene.add(ambient);

    // Sun from the right/front a bit above
    const sun = new THREE.DirectionalLight(0xffffff, 6.0);
    sun.position.set(50, 5, 10);
    sun.target.position.set(0, 0, 0);
    this.scene.add(sun);
    this.scene.add(sun.target);

    // Store references for light adjustments
    this.hemiLight = hemi;
    this.ambientLight = ambient;
    this.sunLight = sun;
    }
    
    createStarfield() {
    console.log('Creating starfield');
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
    
        for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Create stars at varying distances for better depth and coverage
      // Some close (50-150), some medium (150-300), some far (300-500)
      const radiusCategory = Math.random();
      let radius;
      if (radiusCategory < 0.3) {
        radius = 50 + Math.random() * 100; // Close stars (50-150)
      } else if (radiusCategory < 0.7) {
        radius = 150 + Math.random() * 150; // Medium stars (150-300)
      } else {
        radius = 300 + Math.random() * 200; // Far stars (300-500)
      }
      
      // Uniform distribution on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
      
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
      
      // Vary brightness based on distance (farther = dimmer)
      const distanceFactor = Math.max(0.3, 1 - (radius - 50) / 450); // Scale 0.3 to 1.0
      const starBrightness = (0.5 + Math.random() * 0.5) * distanceFactor;
            const colorVariation = Math.random();
      
            if (colorVariation < 0.7) {
        // White stars
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness;
                colors[i3 + 2] = starBrightness;
            } else if (colorVariation < 0.85) {
        // Blue-white stars
                colors[i3] = starBrightness * 0.8;
                colors[i3 + 1] = starBrightness * 0.9;
                colors[i3 + 2] = starBrightness;
            } else {
        // Yellow-orange stars
                colors[i3] = starBrightness;
                colors[i3 + 1] = starBrightness * 0.95;
                colors[i3 + 2] = starBrightness * 0.8;
            }
      
      // Vary size based on distance and brightness
      const sizeVariation = 0.5 + Math.random() * 2.0;
      sizes[i] = sizeVariation * distanceFactor;
        }
    
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
        const starMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: 1.5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9
    });
    
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    
    console.log('Starfield created with', starCount, 'stars at varying distances');
  }

    createAtmosphere() {
    // Atmosphere shader (same as standalone version)
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
        intensity = max(intensity, 0.0); // Ensure positive values
        gl_FragColor = vec4( 0.3, 0.6, 1.0, 0.4 ) * intensity; // Reduced alpha and intensity
      }
    `;

    // Create atmosphere geometry - thin atmospheric layer
    const atmosphereGeom = new THREE.SphereGeometry(2.6, 32, 32); // Thin atmosphere, just slightly larger than Earth
    
    console.log('EarthScene atmosphere geometry created:', atmosphereGeom);
    console.log('EarthScene atmosphere geometry vertices:', atmosphereGeom.attributes.position.count);

    // Create atmosphere material - enhanced shader-based effect
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    // Create atmosphere mesh
    this.atmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
    this.atmosphere.rotation.z = THREE.MathUtils.degToRad(23.5);
    
    // Position atmosphere at origin with no additional scaling
    this.atmosphere.position.set(0, 0, 0);
    // No additional scaling - atmosphere size is controlled by geometry radius
    
    this.scene.add(this.atmosphere);
    
    console.log('EarthScene atmosphere created and added to scene');
    console.log('EarthScene atmosphere material opacity:', atmosphereMaterial.opacity);
    console.log('EarthScene atmosphere material color:', atmosphereMaterial.color);
    console.log('EarthScene atmosphere visible:', this.atmosphere.visible);
    console.log('EarthScene atmosphere in scene:', this.scene.children.includes(this.atmosphere));

    console.log('EarthScene atmosphere created');
  }

  createAstronaut() {
    console.log('Creating astronaut easter egg');
    
    // Create astronaut group
    this.astronaut = new THREE.Group();
    
    // Body (white with slight blue tint)
    const bodyGeometry = new THREE.CapsuleGeometry(0.05, 0.15, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf0f0f0,
      roughness: 0.4,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.astronaut.add(body);
    
    // Helmet (transparent with reflection)
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
    
    // Arms - hanging down naturally
    const armGeometry = new THREE.CapsuleGeometry(0.02, 0.12, 4, 8);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.08, -0.02, 0);
    leftArm.rotation.z = 0; // Arms hanging down
    this.astronaut.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.08, -0.02, 0);
    rightArm.rotation.z = 0; // Arms hanging down
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
    
    // Backpack (life support)
    const backpackGeometry = new THREE.BoxGeometry(0.06, 0.08, 0.04);
    const backpackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.3
    });
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 0.02, -0.08);
    this.astronaut.add(backpack);
    
    // Small antenna on helmet
    const antennaGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.02, 4);
    const antennaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.8
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0.03, 0.15, 0);
    this.astronaut.add(antenna);
    
    // Jetpack for propulsion
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
    
    // Left thruster
    const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    leftThruster.position.set(-0.025, -0.02, -0.15);
    leftThruster.rotation.x = Math.PI / 2;
    this.astronaut.add(leftThruster);
    
    // Right thruster
    const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    rightThruster.position.set(0.025, -0.02, -0.15);
    rightThruster.rotation.x = Math.PI / 2;
    this.astronaut.add(rightThruster);
    
    // Store thrusters for jetpack effects
    this.astronautThrusters = [leftThruster, rightThruster];
    
    // Create jetpack flame effects
    this.createJetpackFlames();
    
    // Free-floating astronaut setup
    this.astronautVisible = false; // Start invisible
    this.astronautJourneyStarted = false;
    this.astronautNextAppearanceTime = Date.now() + (3000 + Math.random() * 5000); // 3-8 seconds for first appearance
    
    // Jetpack thrust animation system
    this.jetpackThrusting = false;
    this.jetpackThrustCycle = 0;
    this.jetpackThrustDuration = 2000; // 2 seconds of thrust
    this.jetpackRestDuration = 1500;   // 1.5 seconds of rest
    this.jetpackCycleStart = 0;
    this.jetpackFlames = [];
    
    // Leg movement animation
    this.legMovementTime = 0;
    this.legMovementSpeed = 0.003;
    this.lastLegMovement = 0;
    this.legMovementInterval = 3000 + Math.random() * 4000; // 3-7 seconds between movements
    
    // Initialize astronaut as invisible
    this.astronaut.visible = false;
    
    // Make astronaut much larger and more visible
    this.astronaut.scale.setScalar(3.0); // Much bigger!
    
    this.scene.add(this.astronaut);
    
    console.log('Astronaut created and added to orbit around Earth');
  }
  
  createJetpackFlames() {
    // Create bright light effects for each thruster
    this.jetpackFlames = [];
    this.jetpackLights = [];
    
    for (let i = 0; i < this.astronautThrusters.length; i++) {
      const thruster = this.astronautThrusters[i];
      
      // Create subtle point light for thrust effect
      const thrustLight = new THREE.PointLight(0x00aaff, 0.8, 3);
      
      // Position light at thruster exit
      thrustLight.position.copy(thruster.position);
      thrustLight.position.z -= 0.05; // Behind thruster
      
      // Start invisible
      thrustLight.visible = false;
      
      // Create a small glowing sphere to visualize the light
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
    
    console.log('Jetpack thrust lights created');
  }
  
  updateAstronautPosition() {
    if (!this.astronaut) return;
    
    const currentTime = Date.now();
    
    // Check if it's time for astronaut to appear
    if (!this.astronautVisible && currentTime > this.astronautNextAppearanceTime) {
      this.startAstronautJourney();
    }
    
    // If astronaut is on a journey, update position
    if (this.astronautJourneyStarted && this.astronautVisible) {
      // Update jetpack thrust cycle
      this.updateJetpackThrust(currentTime);
      
      // Update leg movements
      this.updateAstronautLegs(currentTime);
      
      // Calculate movement speed based on jetpack thrust
      let currentSpeed = this.astronautJourneySpeed;
      if (this.jetpackThrusting) {
        currentSpeed *= 2.5; // Speed up during thrust
      } else {
        currentSpeed *= 0.5; // Slow down during coast
      }
      
      // Update position along journey path
      this.astronautJourneyProgress += currentSpeed;
      
      // Calculate current position along the path
      const t = this.astronautJourneyProgress;
      
      // Smooth interpolation along the path
      const x = this.astronautStartPos.x + (this.astronautEndPos.x - this.astronautStartPos.x) * t;
      const y = this.astronautStartPos.y + (this.astronautEndPos.y - this.astronautStartPos.y) * t;
      const z = this.astronautStartPos.z + (this.astronautEndPos.z - this.astronautStartPos.z) * t;
      
      // Add some gentle bobbing for floating effect
      const floatingY = y + Math.sin(currentTime * 0.001) * 0.05;
      
      this.astronaut.position.set(x, floatingY, z);
      
      // Point astronaut in direction of travel (no tumbling)
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
      
      // Check if journey is complete
      if (this.astronautJourneyProgress >= 1.0) {
        this.endAstronautJourney();
      }
    }
  }
  
  updateJetpackThrust(currentTime) {
    if (!this.jetpackFlames) return;
    
    // Initialize cycle start time if needed
    if (this.jetpackCycleStart === 0) {
      this.jetpackCycleStart = currentTime;
    }
    
    const cycleTime = currentTime - this.jetpackCycleStart;
    const totalCycleTime = this.jetpackThrustDuration + this.jetpackRestDuration;
    
    // Check if we need to start a new cycle
    if (cycleTime >= totalCycleTime) {
      this.jetpackCycleStart = currentTime;
      console.log('🔥 Starting new jetpack cycle');
    }
    
    // Determine current phase
    const currentCycleTime = currentTime - this.jetpackCycleStart;
    const wasThrusting = this.jetpackThrusting;
    
    if (currentCycleTime < this.jetpackThrustDuration) {
      // Thrust phase
      this.jetpackThrusting = true;
      
      // Show thrust lights with flickering effect
      this.jetpackFlames.forEach((glowSphere, index) => {
        glowSphere.visible = true;
        
        // Flicker effect during thrust
        const flicker = 0.6 + Math.sin(currentTime * 0.02 + index) * 0.3;
        glowSphere.scale.setScalar(1.0 + flicker * 0.8);
        
        // Color variation - blue to white hot
        const intensity = 0.8 + Math.sin(currentTime * 0.015 + index * 2) * 0.2;
        glowSphere.material.color.setHSL(0.55, 1.0, intensity);
        glowSphere.material.opacity = 0.8 + flicker * 0.2;
      });
      
      // Animate point lights
      this.jetpackLights.forEach((light, index) => {
        light.visible = true;
        
        // Flicker light intensity - more subtle
        const flicker = 0.8 + Math.sin(currentTime * 0.02 + index) * 0.3;
        light.intensity = 1.0 + flicker * 0.8;
        
        // Color variation
        const hue = 0.55 + Math.sin(currentTime * 0.01 + index) * 0.05;
        light.color.setHSL(hue, 1.0, 0.8);
      });
      
      if (!wasThrusting) {
        console.log('🚀 Jetpack firing!');
      }
    } else {
      // Coast phase
      this.jetpackThrusting = false;
      
      // Hide thrust effects
      this.jetpackFlames.forEach(glowSphere => {
        glowSphere.visible = false;
      });
      
      this.jetpackLights.forEach(light => {
        light.visible = false;
      });
      
      if (wasThrusting) {
        console.log('🌌 Jetpack coasting...');
      }
    }
  }
  
  updateAstronautLegs(currentTime) {
    if (!this.astronautLeftLeg || !this.astronautRightLeg || !this.astronautVisible) return;
    
    // Check if it's time for a new leg movement
    if (currentTime - this.lastLegMovement > this.legMovementInterval) {
      this.lastLegMovement = currentTime;
      this.legMovementTime = 0;
      // Randomize next movement interval
      this.legMovementInterval = 3000 + Math.random() * 4000; // 3-7 seconds
      console.log('👨‍🚀 Astronaut adjusting legs...');
    }
    
    // Animate legs with subtle movements
    this.legMovementTime += this.legMovementSpeed;
    
    // Create gentle, alternating leg movements
    const leftLegMovement = Math.sin(this.legMovementTime) * 0.3;
    const rightLegMovement = Math.sin(this.legMovementTime + Math.PI) * 0.3;
    
    // Apply subtle rotation to legs (like gentle floating adjustments)
    const leftLegRotX = Math.sin(this.legMovementTime * 0.7) * 0.15;
    const rightLegRotX = Math.sin(this.legMovementTime * 0.7 + Math.PI) * 0.15;
    
    const leftLegRotZ = Math.sin(this.legMovementTime * 0.5) * 0.1;
    const rightLegRotZ = Math.sin(this.legMovementTime * 0.5 + Math.PI) * 0.1;
    
    // Smooth decay for natural movement
    const decay = Math.max(0, 1 - this.legMovementTime * 0.2);
    
    // Apply movements with decay
    this.astronautLeftLeg.rotation.x = leftLegRotX * decay;
    this.astronautLeftLeg.rotation.z = leftLegRotZ * decay;
    this.astronautRightLeg.rotation.x = rightLegRotX * decay;
    this.astronautRightLeg.rotation.z = rightLegRotZ * decay;
    
    // Subtle position adjustments
    this.astronautLeftLeg.position.y = -0.12 + leftLegMovement * 0.02 * decay;
    this.astronautRightLeg.position.y = -0.12 + rightLegMovement * 0.02 * decay;
  }
  
  startAstronautJourney() {
    console.log('🚀 Astronaut appearing for journey!');
    
    // Always fly horizontally across the screen (left to right or right to left)
    const direction = Math.random() < 0.5 ? -1 : 1; // -1 = right to left, 1 = left to right
    
    // Start position - well outside the screen
    this.astronautStartPos = {
      x: direction * (20 + Math.random() * 5), // Start far off screen
      y: (Math.random() - 0.5) * 8, // Random height
      z: (Math.random() - 0.5) * 4  // Slight depth variation
    };
    
    // End position - opposite side, well outside the screen
    this.astronautEndPos = {
      x: -direction * (20 + Math.random() * 5), // End far off opposite side
      y: this.astronautStartPos.y + (Math.random() - 0.5) * 3, // Slight height variation
      z: this.astronautStartPos.z + (Math.random() - 0.5) * 2  // Slight depth change
    };
    
    // Journey settings
    this.astronautJourneyProgress = 0;
    this.astronautJourneySpeed = 0.0005 + Math.random() * 0.0003; // Much slower, more realistic
    this.astronautJourneyStarted = true;
    this.astronautVisible = true;
    
    // Position astronaut at start
    this.astronaut.position.set(
      this.astronautStartPos.x,
      this.astronautStartPos.y,
      this.astronautStartPos.z
    );
    
    // Make astronaut visible
    this.astronaut.visible = true;
    
    console.log('🚀 ASTRONAUT IS NOW VISIBLE! Journey from', this.astronautStartPos, 'to', this.astronautEndPos);
    
    // Also log in a more visible way
    if (typeof window !== 'undefined' && window.console) {
      console.log('%c🚀 LOOK! Astronaut is floating across the scene! 🌌', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    }
  }
  
  endAstronautJourney() {
    console.log('🌌 Astronaut journey complete, hiding for next appearance');
    
    // Hide astronaut
    this.astronaut.visible = false;
    this.astronautVisible = false;
    this.astronautJourneyStarted = false;
    
    // Schedule next appearance (30-120 seconds)
    this.astronautNextAppearanceTime = Date.now() + (30000 + Math.random() * 90000);
    
    console.log('Next astronaut appearance in', (this.astronautNextAppearanceTime - Date.now()) / 1000, 'seconds');
  }

  createShootingStars() {
    console.log('Creating shooting stars system');
    
    this.shootingStars = [];
    this.lastShootingStarTime = 0;
    this.shootingStarCooldown = 15000; // 15 seconds between shooting stars
    
    // Shooting star material
    this.shootingStarMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
  }
  
  createShootingStar() {
    // Create a larger, more visible shooting star
    const starGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const starMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    
    // Random starting position closer to the view
    const angle = Math.random() * Math.PI * 2;
    const distance = 25;  // Much closer
    const startX = Math.cos(angle) * distance;
    const startZ = Math.sin(angle) * distance;
    const startY = (Math.random() - 0.5) * 15;
    
    star.position.set(startX, startY, startZ);
    
    // Random velocity toward the center - faster and more visible
    const speed = 1.5 + Math.random() * 1.0;  // Faster movement
    const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
    const velocity = new THREE.Vector3(
      Math.cos(targetAngle) * speed,
      (Math.random() - 0.5) * 0.5,
      Math.sin(targetAngle) * speed
    );
    
    // Create trail effect using a line
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
      linewidth: 3  // Thicker trail
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
    
    console.log('🌠 SHOOTING STAR CREATED! Look for the bright streak!');
    
    // Also log with visibility
    if (typeof window !== 'undefined' && window.console) {
      console.log('%c🌠 SHOOTING STAR! Watch for the bright white streak across the sky! ⭐', 'color: #ffff00; font-size: 14px; font-weight: bold;');
    }
  }
  
  updateShootingStars() {
    const currentTime = Date.now();
    
    // Create new shooting star if enough time has passed - more frequent
    if (currentTime - this.lastShootingStarTime > this.shootingStarCooldown && Math.random() < 0.05) {
      this.createShootingStar();
      this.lastShootingStarTime = currentTime;
      // Randomize next cooldown - shorter intervals
      this.shootingStarCooldown = 1000 + Math.random() * 3000; // 1-4 seconds
    }
    
    // Update existing shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const shootingStar = this.shootingStars[i];
      
      // Update position
      shootingStar.star.position.add(shootingStar.velocity);
      
      // Update trail
      const pos = shootingStar.star.position;
      const trailIndex = shootingStar.trailIndex % (shootingStar.trailPositions.length / 3);
      shootingStar.trailPositions[trailIndex * 3] = pos.x;
      shootingStar.trailPositions[trailIndex * 3 + 1] = pos.y;
      shootingStar.trailPositions[trailIndex * 3 + 2] = pos.z;
      shootingStar.trailIndex++;
      
      shootingStar.trail.geometry.attributes.position.needsUpdate = true;
      
      // Update life - slower decay for longer visibility
      shootingStar.life -= 0.005;
      
      // Fade out - keep brighter longer
      const alpha = shootingStar.life / shootingStar.maxLife;
      shootingStar.star.material.opacity = alpha * 1.0;
      shootingStar.trail.material.opacity = alpha * 0.9;
      
      // Remove if dead or too far
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

  createSatellites() {
    console.log('Creating satellites');
    
    this.satellites = [];
    
    // Create a few different satellites
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
      const orbitSpeed = 0.001 + i * 0.0008; // Much slower satellite movement
      const orbitAngle = (i / 3) * Math.PI * 2;
      const orbitInclination = (Math.random() - 0.5) * Math.PI / 4; // Random inclination
      
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
  
  updateSatellites() {
    if (!this.satellites) return;
    
    this.satellites.forEach(satData => {
      // Update orbit
      satData.orbitAngle += satData.orbitSpeed;
      
      // Calculate position with inclination
      const x = Math.cos(satData.orbitAngle) * satData.orbitRadius;
      const y = Math.sin(satData.orbitInclination) * Math.sin(satData.orbitAngle) * satData.orbitRadius * 0.3;
      const z = Math.sin(satData.orbitAngle) * satData.orbitRadius;
      
      satData.group.position.set(x, y, z);
      
      // Spin the satellite
      satData.group.rotation.y += satData.spinSpeed;
      
      // Make it face its movement direction
      satData.group.lookAt(
        x + Math.cos(satData.orbitAngle + Math.PI/2),
        y,
        z + Math.sin(satData.orbitAngle + Math.PI/2)
      );
    });
  }

  createMorphingGeometry() {
    const segW = 128, segH = 64;
    const planeGeom = new THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

    planeGeom.morphAttributes.position = [];
    planeGeom.morphAttributes.normal = [];

    const sphereFormation = [];
    const sphereNormals = [];

    const uvs = planeGeom.attributes.uv;
    const uv = new THREE.Vector2();
    const t = new THREE.Vector3();

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

    planeGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(sphereFormation, 3);
    planeGeom.morphAttributes.normal[0] = new THREE.Float32BufferAttribute(sphereNormals, 3);

    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load(
      '/textures/world.topo.bathy.200407.3x5400x2700.jpg',
      () => console.log('Texture loaded'),
      undefined,
      (e) => console.error('Texture load error', e)
    );
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.minFilter = THREE.LinearMipmapLinearFilter;
    earthTexture.magFilter = THREE.LinearFilter;

    const mat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      side: THREE.DoubleSide,
      metalness: 0,
      roughness: 1
    });

    this.spherePlane = new THREE.Mesh(planeGeom, mat);
    this.spherePlane.castShadow = false;
    this.spherePlane.receiveShadow = false;
    this.spherePlane.rotation.z = THREE.MathUtils.degToRad(23.5);
    this.spherePlane.morphTargetInfluences[0] = 1;
    this.scene.add(this.spherePlane);
    
    // Track morph state
    this.scrollProgress = 1; // 1 = sphere, 0 = flat
    this.isScrolling = false;
    this.hasStartedMorphing = false;
    this.currentRotationY = 0; // Track current Y rotation for smooth animation
    this.targetRotationY = 0; // Target Y rotation
    this.rotationSpeed = 0.05; // Speed of rotation animation
    }

  updateTransformation(progress) {
    if (!this.spherePlane) return;
    
    // Convert progress (0-1 where 1 is fully morphed) to scrollProgress (1-0 where 1 is sphere)
    this.scrollProgress = 1 - progress;
    this.spherePlane.morphTargetInfluences[0] = this.scrollProgress;
    
    // Track if user has started morphing
    if (progress > 0) {
      this.hasStartedMorphing = true;
    }
    
    // Adjust lighting during morph
    const t = progress; // 0 = sphere, 1 = flat
    if (this.hemiLight && this.ambientLight) {
      const hemiIntensity = 0.06 + t * 0.4;
      this.hemiLight.intensity = hemiIntensity;
      
      const ambientIntensity = t * 0.6;
      this.ambientLight.intensity = ambientIntensity;
    }
    
    // Update atmosphere visibility and rotation
    if (this.atmosphere) {
      // For shader material, the atmospheric effect is built into the shader
      // The shader naturally creates the proper blue glow effect
      
      // Sync atmosphere rotation with Earth
      this.atmosphere.rotation.y = this.currentRotationY;
    }
    
    // Gradually reduce tilt when morphing - completely flat when fully morphed
    // scrollProgress: 1 = sphere (keep tilt), 0 = flat (no tilt)
    let targetTilt = this.scrollProgress * THREE.MathUtils.degToRad(23.5);
    
    // Ensure completely flat in final phase (when progress > 0.85)
    if (progress > 0.85) {
      targetTilt = 0; // Force completely flat for the final zoom phase
      // Also lock the Y rotation to face forward when fully flat
      this.spherePlane.rotation.y = 0;
    }
    
    this.spherePlane.rotation.z = targetTilt;
    
    // Sync atmosphere tilt with Earth
    if (this.atmosphere) {
      this.atmosphere.rotation.z = targetTilt;
    }
    
    // NATURAL FULL-SCREEN ANIMATION LOGIC
        const easedProgress = this.easeInOutCubic(progress);
    
    // Simple camera zoom animation - no lateral movement
    let cameraZ = 15;
    
    if (progress < 0.85) {
      // Gradual zoom in during morphing
      cameraZ = 15 - progress * 8; // Zoom from 15 to 7
      this.spherePlane.scale.setScalar(1.0);
    } else {
      // Final zoom phase with scaling for full-screen effect
      const finalProgress = (progress - 0.85) / 0.15;
      const smoothFinal = this.easeInOutCubic(finalProgress);
      
      cameraZ = 7 - smoothFinal * 4; // Final zoom (7 -> 3)
      
      // Scale up the plane to fill the screen
      const scaleMultiplier = 1 + smoothFinal * 2.5; // Scale up to 3.5x
      this.spherePlane.scale.setScalar(scaleMultiplier);
    }
    
    // For flat plane viewing, we want NO rotation at all when fully morphed
    // The Earth should appear as a standard flat map
    if (progress < 0.8) {
      // During morphing, gradually stop any rotation and orient for flat viewing
      const rotationReduction = progress / 0.8; // 0 to 1 over first 80%
      // Gradually reduce any current rotation to zero for perfect flat view
      this.targetRotationY = this.currentRotationY * (1 - rotationReduction);
    } else {
      // Final 20%: Lock to perfect flat orientation (no rotation)
      this.targetRotationY = 0;
    }
    
    // Smoothly interpolate current rotation towards target rotation
    let rotationDiff = this.targetRotationY - this.currentRotationY;
    
    // Normalize rotation difference to always take the shortest path
    while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
    while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
    
    // Apply smooth rotation interpolation with higher speed during morphing
    const morphingSpeed = progress > 0 ? 0.08 : this.rotationSpeed; // Faster during morphing
    this.currentRotationY += rotationDiff * morphingSpeed;
    
    // Apply the smoothly animated rotation
    this.spherePlane.rotation.y = this.currentRotationY;
    
    // Apply camera position - only zoom, no lateral movement or rotation
        this.camera.position.set(0, 0, cameraZ);
    // Camera stays centered and oriented forward - no rotation
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    update() {
    if (!this.spherePlane) return;
    
    // Handle natural Earth rotation vs morphing animation
    const shouldRotate = !this.isScrolling && (!this.hasStartedMorphing || this.scrollProgress === 1);
    
    if (shouldRotate) {
      // Natural rotation when not morphing
      this.currentRotationY += THREE.MathUtils.degToRad(0.5);
      this.targetRotationY = this.currentRotationY; // Keep target synced
      this.spherePlane.rotation.y = this.currentRotationY;
    } else if (this.hasStartedMorphing) {
      // During morphing, rotation is controlled by updateTransformation
      // The smooth interpolation happens there, so we don't modify rotation here
    }
    
    // Animate starfield with subtle rotation
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
            this.stars.rotation.x += 0.0001;
        }
        
        // Update easter eggs
        this.updateAstronautPosition();
        this.updateShootingStars();
        this.updateSatellites();
    }
}

// Standalone initialization commented out since main.js handles initialization
// document.addEventListener('DOMContentLoaded', init);
