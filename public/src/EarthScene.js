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
    }
}

// Standalone initialization commented out since main.js handles initialization
// document.addEventListener('DOMContentLoaded', init);
