import * as THREE from '/three/build/three.module.js';

// Three.js Scene Setup
let scene, camera, renderer;
let spherePlane;
let scrollProgress = 1; // 1 = sphere, 0 = flat
let isScrolling = false;
let scrollTimeout;
let hasStartedMorphing = false; // Track if user has ever started morphing
let cloudRotationY = 0; // Independent cloud rotation

// Mouse controls
let mouseX = 0, mouseY = 0;
let isMouseDown = false;
let worldRotationY = 0;
let targetWorldRotationY = 0;

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
  const atmosphereGeom = new THREE.SphereGeometry(2.8, 32, 32); // Thin atmosphere, just slightly larger than Earth
  
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

// Cloud layer function with morphing
function createCloudLayer() {
  // Create morphing cloud geometry similar to Earth
  const segW = 128, segH = 64;
  const cloudPlaneGeom = new THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

  cloudPlaneGeom.morphAttributes.position = [];
  cloudPlaneGeom.morphAttributes.normal = [];

  const cloudSphereFormation = [];
  const cloudSphereNormals = [];

  const uvs = cloudPlaneGeom.attributes.uv;
  const uv = new THREE.Vector2();
  const t = new THREE.Vector3();

  for (let i = 0; i < uvs.count; i++) {
    uv.fromBufferAttribute(uvs, i);

    // equirectangular sphere from UVs - slightly larger than Earth
    t.setFromSphericalCoords(
      2.52,                                  // radius (slightly larger than Earth's 2.5)
      Math.PI * (1 - uv.y),                  // polar
      Math.PI * (uv.x - 0.5) * 2             // azimuth
    );

    cloudSphereFormation.push(t.x, t.y, t.z);

    // normal = normalized position on perfect sphere
    const len = Math.hypot(t.x, t.y, t.z) || 1;
    cloudSphereNormals.push(t.x / len, t.y / len, t.z / len);
  }

  cloudPlaneGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(cloudSphereFormation, 3);
  cloudPlaneGeom.morphAttributes.normal[0]   = new THREE.Float32BufferAttribute(cloudSphereNormals, 3);
  
  // Load cloud texture
  const loader = new THREE.TextureLoader();
  const cloudTexture = loader.load(
    '/textures/Clouds.png',
    () => console.log('Cloud texture loaded'),
    undefined,
    (e) => console.error('Cloud texture load error', e)
  );
  cloudTexture.colorSpace = THREE.SRGBColorSpace;
  cloudTexture.minFilter = THREE.LinearMipmapLinearFilter;
  cloudTexture.magFilter = THREE.LinearFilter;
  cloudTexture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy?.() || 8);
  
  // Create cloud material with transparency
  const cloudMaterial = new THREE.MeshStandardMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.6, // Semi-transparent clouds
    side: THREE.DoubleSide,
    metalness: 0,
    roughness: 1.0,
    alphaTest: 0.1 // Helps with transparency sorting
  });
  
  // Create cloud mesh with morphing
  window.cloudLayer = new THREE.Mesh(cloudPlaneGeom, cloudMaterial);
  window.cloudLayer.rotation.z = THREE.MathUtils.degToRad(23.5); // Same tilt as Earth
  window.cloudLayer.position.set(0, 0, 0);
  
  // Start as globe
  window.cloudLayer.morphTargetInfluences[0] = 1;
  
  scene.add(window.cloudLayer);
  
  console.log('Cloud layer created with morphing and added to scene');
  console.log('Cloud layer opacity:', cloudMaterial.opacity);
  console.log('Cloud layer visible:', window.cloudLayer.visible);
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
  
  // Create cloud layer
  createCloudLayer();
}

// Render loop
function animate() {
  // Smooth world rotation interpolation
  const rotationSpeed = 0.1;
  worldRotationY += (targetWorldRotationY - worldRotationY) * rotationSpeed;
  
  if (spherePlane?.morphTargetInfluences) {
     spherePlane.morphTargetInfluences[0] = scrollProgress;
     
     // Update cloud layer morphing
     if (window.cloudLayer?.morphTargetInfluences) {
       window.cloudLayer.morphTargetInfluences[0] = scrollProgress;
       
       // Dynamic cloud layer scaling: adapt to transformation state
       const progress = 1 - scrollProgress; // Convert to progress (0-1 where 1 is fully morphed)
       const earthScale = spherePlane.scale.x; // Get current Earth scale
       
       if (progress > 0) {
         // During transformation, scale cloud layer to match Earth radius but stay slightly in front
         // Cloud base radius (2.52) needs to be scaled to match Earth effective radius (2.5 * earthScale)
         // Then add 0.8% to keep it in front: (2.5 * earthScale * 1.008) / 2.52
         const cloudScale = (2.5 * earthScale * 1.008) / 2.52;
         window.cloudLayer.scale.setScalar(cloudScale);
         
         // Debug logging during transformation
         if (Math.random() < 0.01) { // Log occasionally to avoid spam
           console.log('TRANSFORMATION DEBUG:');
           console.log('  Progress:', progress.toFixed(3));
           console.log('  Earth scale:', earthScale.toFixed(3));
           console.log('  Cloud scale:', cloudScale.toFixed(3));
           console.log('  Earth effective radius:', (2.5 * earthScale).toFixed(3));
           console.log('  Cloud effective radius:', (2.52 * cloudScale).toFixed(3));
           console.log('  Earth morph influence:', spherePlane.morphTargetInfluences[0].toFixed(3));
           console.log('  Cloud morph influence:', window.cloudLayer.morphTargetInfluences[0].toFixed(3));
         }
       } else {
         // When sphere, use normal scale (2.52 radius)
         window.cloudLayer.scale.setScalar(earthScale);
       }
     }
     
     // Update atmosphere visibility based on scroll progress
     if (window.atmosphere) {
       // Hide atmosphere when scrolling begins (scrollProgress < 1), show when back to full sphere (scrollProgress === 1)
       if (scrollProgress < 1) {
         window.atmosphere.visible = false;
       } else {
         window.atmosphere.visible = true;
       }
       
       // Sync atmosphere rotation with Earth
       window.atmosphere.rotation.y = spherePlane.rotation.y;
       window.atmosphere.rotation.z = spherePlane.rotation.z;
     }
     
     // Natural Earth rotation: west to east (positive Y rotation)
     // Rotate when: not scrolling AND (never morphed OR back to full globe)
     const shouldRotate = !isScrolling && (!hasStartedMorphing || scrollProgress === 1);
     
     // Update cloud layer rotation independently (faster than Earth)
     if (window.cloudLayer && shouldRotate) {
       // Clouds rotate independently at a faster speed
       cloudRotationY += THREE.MathUtils.degToRad(0.1); // Faster than Earth's 0.05°/sec
     }
     if (shouldRotate) {
       // Earth rotates 360° in 24 hours = 15°/hour = 0.25°/minute = ~0.004°/second
       // Slower rotation for more peaceful viewing: 0.05° per second
       spherePlane.rotation.y += THREE.MathUtils.degToRad(0.05);
     }
     
     // Apply world rotation to all objects (only Y-axis)
     spherePlane.rotation.y += worldRotationY;
     
     if (window.atmosphere) {
       window.atmosphere.rotation.y += worldRotationY;
     }
     
     if (window.cloudLayer) {
       // During transformation, sync cloud rotation with Earth rotation
       if (isScrolling || hasStartedMorphing) {
         // During transformation, sync with Earth
         window.cloudLayer.rotation.y = spherePlane.rotation.y;
       } else {
         // When not transforming, use independent rotation
         window.cloudLayer.rotation.y = cloudRotationY + worldRotationY;
       }
     }
     
     // Handle scaling during final zoom phase (standalone version)
     const progress = 1 - scrollProgress; // Convert to progress (0-1 where 1 is fully morphed)
     if (progress > 0.85) {
       // Final zoom phase with scaling for full-screen effect
       const finalProgress = (progress - 0.85) / 0.15;
       const smoothFinal = finalProgress < 0.5 ? 2 * finalProgress * finalProgress : 1 - Math.pow(-2 * finalProgress + 2, 2) / 2;
       
       // Scale up the plane to fill the screen
       const scaleMultiplier = 1 + smoothFinal * 2.5; // Scale up to 3.5x
       spherePlane.scale.setScalar(scaleMultiplier);
       
       // Cloud layer scaling is now handled dynamically in the morphing logic above
     } else {
       // Reset scale during normal morphing
       spherePlane.scale.setScalar(1.0);
       // Cloud layer scaling is now handled dynamically in the morphing logic above
     }
     
     if (isScrolling) {
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
       
       // Apply same tilt to cloud layer
       if (window.cloudLayer) {
         window.cloudLayer.rotation.z = targetTilt;
       }
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
  
  // Mouse controls
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mouseleave', onMouseUp);
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
   
   // Reset mouse rotation when starting to scroll to prevent wild rotation
   targetWorldRotationY = 0;
   
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

// Mouse controls
function onMouseDown(e) {
  isMouseDown = true;
  mouseX = e.clientX;
  mouseY = e.clientY;
}

function onMouseMove(e) {
  if (!isMouseDown) return;
  
  const deltaX = e.clientX - mouseX;
  
  // Only rotate around Y-axis (Earth's natural rotation axis)
  targetWorldRotationY += deltaX * 0.01;
  
  mouseX = e.clientX;
  mouseY = e.clientY;
}

function onMouseUp() {
  isMouseDown = false;
}

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
    this.createCloudLayer();
    this.createAstronaut();
    this.createShootingStars();
    this.createSatellites();
    this.setupMouseControls();
    
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
    const atmosphereGeom = new THREE.SphereGeometry(2.8, 32, 32); // Thin atmosphere, just slightly larger than Earth
    
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

  createCloudLayer() {
    // Create morphing cloud geometry similar to Earth
    const segW = 128, segH = 64;
    const cloudPlaneGeom = new THREE.PlaneGeometry(Math.PI * 5, Math.PI * 2.5, segW, segH);

    cloudPlaneGeom.morphAttributes.position = [];
    cloudPlaneGeom.morphAttributes.normal = [];

    const cloudSphereFormation = [];
    const cloudSphereNormals = [];

    const uvs = cloudPlaneGeom.attributes.uv;
    const uv = new THREE.Vector2();
    const t = new THREE.Vector3();

    for (let i = 0; i < uvs.count; i++) {
      uv.fromBufferAttribute(uvs, i);

      // equirectangular sphere from UVs - slightly larger than Earth
      t.setFromSphericalCoords(
        2.52,                                  // radius (slightly larger than Earth's 2.5)
        Math.PI * (1 - uv.y),                  // polar
        Math.PI * (uv.x - 0.5) * 2             // azimuth
      );

      cloudSphereFormation.push(t.x, t.y, t.z);

      // normal = normalized position on perfect sphere
      const len = Math.hypot(t.x, t.y, t.z) || 1;
      cloudSphereNormals.push(t.x / len, t.y / len, t.z / len);
    }

    cloudPlaneGeom.morphAttributes.position[0] = new THREE.Float32BufferAttribute(cloudSphereFormation, 3);
    cloudPlaneGeom.morphAttributes.normal[0]   = new THREE.Float32BufferAttribute(cloudSphereNormals, 3);
    
    // Load cloud texture
    const loader = new THREE.TextureLoader();
    const cloudTexture = loader.load(
      '/textures/Clouds.png',
      () => console.log('EarthScene cloud texture loaded'),
      undefined,
      (e) => console.error('EarthScene cloud texture load error', e)
    );
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.minFilter = THREE.LinearMipmapLinearFilter;
    cloudTexture.magFilter = THREE.LinearFilter;
    cloudTexture.anisotropy = Math.min(16, 16); // Use a reasonable default
    
    // Create cloud material with transparency
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.6, // Semi-transparent clouds
      side: THREE.DoubleSide,
      metalness: 0,
      roughness: 1.0,
      alphaTest: 0.05, // Lower threshold for better edge handling
      depthWrite: false, // Prevent depth writing issues
      depthTest: true, // Still test depth but don't write
      polygonOffset: true, // Enable polygon offset
      polygonOffsetFactor: -1, // Negative factor to push forward
      polygonOffsetUnits: -1 // Additional offset units
    });
    
    // Create cloud mesh with morphing
    this.cloudLayer = new THREE.Mesh(cloudPlaneGeom, cloudMaterial);
    this.cloudLayer.rotation.z = THREE.MathUtils.degToRad(23.5); // Same tilt as Earth
    this.cloudLayer.position.set(0, 0, 0.02); // Increased forward offset to prevent z-fighting
    
    // Set render order to ensure clouds render after Earth
    this.cloudLayer.renderOrder = 1;
    
    // Start as globe
    this.cloudLayer.morphTargetInfluences[0] = 1;
    
    this.scene.add(this.cloudLayer);
    
    console.log('EarthScene cloud layer created with morphing and added to scene');
    console.log('EarthScene cloud layer opacity:', cloudMaterial.opacity);
    console.log('EarthScene cloud layer visible:', this.cloudLayer.visible);
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
    this.shootingStarCooldown = 15000; // 15git sta seconds between shooting stars
    
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
  
  setupMouseControls() {
    // Mouse controls
    this.onMouseDown = (e) => {
      this.isMouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };
    
    this.onMouseMove = (e) => {
      if (!this.isMouseDown) return;
      
      const deltaX = e.clientX - this.mouseX;
      
      // Only rotate around Y-axis (Earth's natural rotation axis)
      this.targetWorldRotationY += deltaX * 0.01;
      
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    };
    
    this.onMouseUp = () => {
      this.isMouseDown = false;
    };
    
    // Add event listeners
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mouseleave', this.onMouseUp);
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
    
    // Set render order to ensure Earth renders before clouds
    this.spherePlane.renderOrder = 0;
    
    this.scene.add(this.spherePlane);
    
    // Track morph state
    this.scrollProgress = 1; // 1 = sphere, 0 = flat
    this.isScrolling = false;
    this.hasStartedMorphing = false;
    this.currentRotationY = 0; // Track current Y rotation for smooth animation
    this.targetRotationY = 0; // Target Y rotation
    this.rotationSpeed = 0.05; // Speed of rotation animation
    this.cloudRotationY = 0; // Independent cloud rotation
    
    // Mouse controls
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;
    this.worldRotationY = 0;
    this.targetWorldRotationY = 0;
    }

  updateTransformation(progress) {
    if (!this.spherePlane) return;
    
    // Reset mouse rotation when starting to scroll to prevent wild rotation
    if (progress > 0 && this.targetWorldRotationY !== 0) {
      this.targetWorldRotationY = 0;
    }
    
    // Convert progress (0-1 where 1 is fully morphed) to scrollProgress (1-0 where 1 is sphere)
    this.scrollProgress = 1 - progress;
    this.spherePlane.morphTargetInfluences[0] = this.scrollProgress;
    
    // Update cloud layer morphing
    if (this.cloudLayer?.morphTargetInfluences) {
      this.cloudLayer.morphTargetInfluences[0] = this.scrollProgress;
      
      // Dynamic cloud layer scaling: adapt to transformation state
      const earthScale = this.spherePlane.scale.x; // Get current Earth scale
      
      if (progress > 0) {
        // During transformation, scale cloud layer to match Earth radius but stay slightly in front
        // Cloud base radius (2.52) needs to be scaled to match Earth effective radius (2.5 * earthScale)
        // Add more separation (2%) to prevent z-fighting: (2.5 * earthScale * 1.02) / 2.52
        const cloudScale = (2.5 * earthScale * 1.02) / 2.52;
        this.cloudLayer.scale.setScalar(cloudScale);
        
        // Ensure cloud layer is always positioned in front during transformation
        this.cloudLayer.position.z = 0.02 + (progress * 0.01); // Dynamic forward offset
        
        // Debug logging during transformation
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
          console.log('CLASS TRANSFORMATION DEBUG:');
          console.log('  Progress:', progress.toFixed(3));
          console.log('  Earth scale:', earthScale.toFixed(3));
          console.log('  Cloud scale:', cloudScale.toFixed(3));
          console.log('  Earth effective radius:', (2.5 * earthScale).toFixed(3));
          console.log('  Cloud effective radius:', (2.52 * cloudScale).toFixed(3));
          console.log('  Earth morph influence:', this.spherePlane.morphTargetInfluences[0].toFixed(3));
          console.log('  Cloud morph influence:', this.cloudLayer.morphTargetInfluences[0].toFixed(3));
        }
      } else {
        // When sphere, use normal scale (2.52 radius)
        this.cloudLayer.scale.setScalar(earthScale);
        // Reset position to base offset
        this.cloudLayer.position.z = 0.02;
      }
    }
    
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
      // Hide atmosphere when scrolling begins (progress > 0), show when back to 0
      if (progress > 0) {
        this.atmosphere.visible = false;
      } else {
        this.atmosphere.visible = true;
      }
      
      // Sync atmosphere rotation with Earth
      this.atmosphere.rotation.y = this.currentRotationY;
    }
    
    // Update cloud layer rotation (keep visible during transformation)
    if (this.cloudLayer) {
      // During transformation, sync cloud rotation with Earth rotation
      // Only use independent rotation when not transforming
      if (progress > 0) {
        // During transformation, sync with Earth
        this.cloudLayer.rotation.y = this.currentRotationY;
      } else {
        // When not transforming, use independent rotation
        this.cloudRotationY += THREE.MathUtils.degToRad(0.1); // Faster than Earth's 0.05°/sec
        this.cloudLayer.rotation.y = this.cloudRotationY;
      }
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
    
    // Sync cloud layer tilt with Earth
    if (this.cloudLayer) {
      this.cloudLayer.rotation.z = targetTilt;
    }
    
    // NATURAL FULL-SCREEN ANIMATION LOGIC
        const easedProgress = this.easeInOutCubic(progress);
    
    // Simple camera zoom animation - no lateral movement
    let cameraZ = 15;
    
    if (progress < 0.85) {
      // Gradual zoom in during morphing
      cameraZ = 15 - progress * 8; // Zoom from 15 to 7
      this.spherePlane.scale.setScalar(1.0);
      
      // Cloud layer scaling is now handled dynamically in the morphing logic above
    } else {
      // Final zoom phase with scaling for full-screen effect
      const finalProgress = (progress - 0.85) / 0.15;
      const smoothFinal = this.easeInOutCubic(finalProgress);
      
      cameraZ = 7 - smoothFinal * 4; // Final zoom (7 -> 3)
      
      // Scale up the plane to fill the screen
      const scaleMultiplier = 1 + smoothFinal * 2.5; // Scale up to 3.5x
      this.spherePlane.scale.setScalar(scaleMultiplier);
      
      // Cloud layer scaling is now handled dynamically in the morphing logic above
    }
    
    // During transformation, don't try to control rotation - let mouse rotation persist
    // The mouse rotation will be applied on top of the base rotation in the update method
    
    // Apply camera position - only zoom, no lateral movement or rotation
        this.camera.position.set(0, 0, cameraZ);
    // Camera stays centered and oriented forward - no rotation
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    update() {
    if (!this.spherePlane) return;
    
    // Smooth world rotation interpolation
    const rotationSpeed = 0.1;
    this.worldRotationY += (this.targetWorldRotationY - this.worldRotationY) * rotationSpeed;
    
    // Handle natural Earth rotation vs morphing animation
    const shouldRotate = !this.isScrolling && (!this.hasStartedMorphing || this.scrollProgress === 1);
    
    if (shouldRotate) {
      // Natural rotation when not morphing - slower for peaceful viewing
      this.currentRotationY += THREE.MathUtils.degToRad(0.05);
      this.targetRotationY = this.currentRotationY; // Keep target synced
      
      // Update cloud rotation independently (faster than Earth)
      if (this.cloudLayer) {
        this.cloudRotationY += THREE.MathUtils.degToRad(0.1); // Faster than Earth's 0.05°/sec
      }
    }
    
    // Apply base rotation + mouse rotation to all objects (only Y-axis)
    const totalRotationY = this.currentRotationY + this.worldRotationY;
    this.spherePlane.rotation.y = totalRotationY;
    
    if (this.atmosphere) {
      this.atmosphere.rotation.y = totalRotationY;
    }
    
    if (this.cloudLayer) {
      // During transformation, sync cloud rotation with Earth rotation
      if (this.isScrolling || this.hasStartedMorphing) {
        // During transformation, sync with Earth
        this.cloudLayer.rotation.y = this.currentRotationY + this.worldRotationY;
      } else {
        // When not transforming, use independent rotation
        this.cloudLayer.rotation.y = this.cloudRotationY + this.worldRotationY;
      }
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
