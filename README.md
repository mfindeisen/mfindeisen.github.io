# Interactive Earth Portfolio 🌍

A stunning, interactive 3D visualization that transforms a realistic rotating Earth sphere into a flat, highly detailed interactive map (powered by MapTiler) through a smooth scroll-driven animation. Watch as the Earth naturally "peels apart", revealing an interactive map that flies directly to Erbil, Iraq, before presenting a full portfolio experience!

## ✨ Features

- 🌍 **Realistic 3D Earth Sphere** - High-quality NASA Earth texture with natural rotation, dynamic clouds, and atmosphere using Three.js.
- 🍊 **Natural Orange-Peel Unwrapping** - Scroll down to watch the Earth split and spread apart naturally into a flat plane.
- 🗺️ **Seamless Map Integration** - Morphs seamlessly into a fully interactive MapLibre/MapTiler vector map.
- ✈️ **Cinematic FlyTo Animation** - Automatically transitions into a smooth camera flight to Erbil, Iraq.
- 🎨 **Interactive Overlays** - Features a sleek Portfolio and Showcase overlay system that slides in after the journey.
- 🌟 **Dynamic Lighting & Effects** - Realistic sun lighting, an immersive starfield background, and hidden easter eggs (like a meteor strike!).
- 🚀 **Optimized Performance** - Powered by Vite, utilizing morph targets for smooth 60fps animations.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio_earth
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```
   *(Note: This project uses `pnpm` instead of `npm` or `yarn`)*

3. **Start the development server**
   ```bash
   pnpm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

5. **Explore!**
   - Click **"Scroll to explore"** or simply scroll down to watch the Earth unwrap.
   - Use the **Skip** buttons to instantly jump to the interactive map or portfolio overlays.
   - Click **"Back to Beginning"** to seamlessly animate back to the 3D globe.

## 🎮 How It Works

### The Animation Journey:
1. **Sphere Mode (Top of page)** - Realistic rotating Earth with natural day/night lighting.
2. **Unwrapping (Scrolling down)** - Earth splits at the Pacific Ocean and spreads apart into a flat plane.
3. **Map Transition** - The 3D plane seamlessly crossfades into an interactive MapLibre instance.
4. **Cinematic Flight** - The map automatically flies to the target destination (Erbil).
5. **Portfolio Reveal** - Once arrived, the interactive overlays slide into view.

### Technical Implementation:
- **Three.js to MapLibre Handoff** - Complex state management to synchronize the 3D WebGL scene with the 2D vector map layer.
- **Dual Geometry System** - Custom shader and geometry morph targets for the natural spreading motion.
- **Vite Ecosystem** - Fast HMR (Hot Module Replacement) and optimized production builds.

## 📁 Project Structure

```
portfolio_earth/
├── index.html                 # Main HTML entry point
├── package.json               # Dependencies and Vite scripts
├── vite.config.js             # Vite configuration
├── public/
│   ├── style.css              # Global styles and UI animations
│   ├── textures/              # Earth textures and assets
│   └── src/
│       ├── main.js            # App initialization
│       ├── core/App.js        # Main application orchestrator & state machine
│       ├── earth/             # Three.js globe, stars, clouds, and atmosphere
│       ├── effects/           # Animations, Scroll controllers, Easter eggs
│       ├── ui/UIManager.js    # DOM manipulation and overlay state
│       ├── MapManager.js      # MapTiler/MapLibre integration
│       └── PlacesManager.js   # Map markers and interactive places
└── README.md
```

## 🛠️ Technical Stack

- **Frontend Build Tool**: Vite
- **3D Graphics**: Three.js
- **Interactive Maps**: MapLibre GL JS & MapTiler
- **Styling**: Vanilla CSS with modern animations and transitions
- **Package Manager**: pnpm

## 📝 License

This project is open source. Feel free to use and modify it for your own projects!

---

**Experience the Earth like never before - watch our planet transform from a 3D sphere into a fully interactive portfolio! 🌍✨**