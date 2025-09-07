# Earth Unwrap Visualization 🌍

A stunning Three.js visualization that transforms a realistic rotating Earth sphere into a flat world map through scroll-driven animation. Watch as the Earth naturally "peels apart" like an orange, revealing the complete world map!

## ✨ Features

- 🌍 **Realistic Earth Sphere** - High-quality NASA Earth texture with natural rotation
- 🍊 **Natural Orange-Peel Unwrapping** - Earth splits from the back and spreads apart naturally
- 📜 **Scroll-Driven Animation** - Smooth morphing controlled by page scroll
- 🌟 **Dynamic Lighting** - Realistic sun lighting with starfield background
- 🎯 **Smart Final Rotation** - Automatically rotates to optimal viewing angle
- 🚀 **Optimized Performance** - Morph targets for smooth 60fps animation

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

5. **Scroll down** to watch the Earth unwrap! 🌍➡️🗺️

## 🎮 How It Works

### The Animation Phases:
1. **Sphere Mode (0%)** - Realistic rotating Earth with natural day/night lighting
2. **Unwrapping (0-90%)** - Earth splits at the Pacific Ocean and spreads apart like peeling an orange
3. **Final Rotation (90-100%)** - Plane rotates to face the camera for optimal viewing

### Technical Implementation:
- **Dual Geometry System** - Separate left and right halves for natural spreading motion
- **Morph Targets** - Smooth transition between sphere and plane geometries
- **UV Coordinate Mapping** - Maintains texture consistency during transformation
- **Shortest Path Rotation** - Intelligent final rotation that never exceeds 180°

## 📁 Project Structure

```
portfolio2/
├── server.js                 # Express server for development
├── package.json             # Dependencies and npm scripts
├── public/
│   ├── index.html           # Main HTML file
│   ├── textures/
│   │   └── world.topo.bathy.200407.3x5400x2700.jpg  # NASA Earth texture
│   └── src/
│       ├── main.js          # Application entry point & scroll reset
│       ├── EarthScene.js    # Three.js scene, Earth geometry & lighting
│       └── ScrollController.js  # Scroll progress calculation
└── README.md
```

## 🛠️ Technical Stack

- **Backend**: Node.js + Express
- **3D Graphics**: Three.js
- **Textures**: NASA Blue Marble Earth imagery
- **Animation**: Morph targets with easing functions
- **Geometry**: Custom sphere-to-plane transformation

## 🎨 Key Features Explained

### Natural Orange-Peel Effect
Unlike traditional map projections, this visualization splits the Earth at its natural seam (Pacific Ocean) and spreads the halves apart like peeling an orange - no artificial stretching or distortion during the unwrapping process.

### Realistic Lighting
- **Sun Lighting** - Directional light simulating the sun's position
- **Ambient Lighting** - Ensures Earth remains visible without harsh shadows  
- **Starfield Background** - Thousands of stars for spatial context
- **Dynamic Sun Object** - Visible sun with glow effect

### Smart Rotation System
- **Natural Rotation** - Earth rotates west-to-east when in sphere mode
- **Smooth Stops** - Rotation pauses naturally when scrolling begins
- **Intelligent Final Rotation** - Calculates shortest path to optimal viewing angle

## 🔧 Customization Options

### Modify Earth Appearance
```javascript
// In EarthScene.js - adjust lighting
this.sunLight.intensity = 2.0;  // Sun brightness
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);  // Ambient light
```

### Adjust Animation Timing
```javascript
// In EarthScene.js - change rotation phases
if (progress >= 0.9) {  // When final rotation starts (90% vs 85%, etc.)
```

### Change Scroll Sensitivity
```javascript
// In ScrollController.js - modify scroll calculation
const progress = Math.min(Math.max(currentScroll / this.maxScroll, 0), 1);
```

## 🌟 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires WebGL support for 3D rendering.

## 📝 License

This project is open source. Feel free to use and modify for your own projects!

---

**Experience the Earth like never before - watch our planet transform from a 3D sphere into the familiar flat world map! 🌍✨**