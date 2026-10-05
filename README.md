# Interactive Earth Portfolio 🌍

Live: [mfindeisen.github.io](https://mfindeisen.github.io)

The portfolio of Matthias Findeisen. A realistic 3D Earth "peels apart" into a flat plane as you scroll, hands off to an interactive MapLibre/MapTiler vector map, and flies to Erbil, Iraq, where the portfolio and showcase overlays open.

## ✨ Features

- 🌍 **Realistic 3D Earth** - NASA textures, rotating clouds, atmosphere and sun lighting with Three.js.
- 🍊 **Orange-peel unwrapping** - Scroll-driven morph targets turn the sphere into a flat plane.
- 🗺️ **Seamless map handoff** - The flat plane crossfades into a MapLibre GL map aligned to the same projection.
- ✈️ **Cinematic flyTo** - The map flies to Erbil and reveals places with photo galleries and 360° panoramas.
- 🎨 **Portfolio & Showcase overlays** - About, experience and the open-source RTI toolset (modernRtiViewer, rtiDb, rtiprep, neural_rti).
- 🌟 **Easter eggs** - Press `H` on the start screen.
- ♿ **Accessible** - Keyboard navigable dialogs (Esc to close, focus trap) and `prefers-reduced-motion` support.

## 🚀 Quick Start

This project uses [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/mfindeisen/mfindeisen.github.io.git
cd mfindeisen.github.io
pnpm install
pnpm run dev        # http://127.0.0.1:4001
```

Other scripts:

```bash
pnpm run build      # production build into dist/
pnpm run preview    # serve the production build
pnpm run typecheck  # TypeScript type check
```

### MapTiler API key

The public MapTiler key in `App.ts` only works on `mfindeisen.github.io`. For local development, create `public/.env.local` (Vite reads env files from its root, `public/`) with your own key:

```bash
VITE_MAPTILER_LOCAL_API_KEY=your-key
```

Without it the 3D globe and overlays still work locally, but the map does not load.

## 🎮 How It Works

1. **Sphere mode (top of page)** - Rotating Earth with day/night lighting.
2. **Unwrapping (scrolling down)** - The Earth splits at the Pacific and spreads into a flat plane.
3. **Map transition** - The plane crossfades into the MapLibre map.
4. **Flight** - The map flies to Erbil.
5. **Portfolio reveal** - The overlays open and the places list becomes available.

The **Showcase** and **Portfolio** buttons skip the journey and open the overlays directly.

## 📁 Project Structure

```
mfindeisen.github.io/
├── vite.config.js             # Vite config (root is public/)
├── package.json
└── public/
    ├── index.html             # Entry point, overlays and SEO meta tags
    ├── style.css              # Global styles
    ├── showcase/              # Media for the showcase cards
    ├── textures/              # Earth textures and place photos (+ thumbnails)
    └── src/
        ├── main.ts            # App bootstrap
        ├── core/App.ts        # Orchestrator and scroll/journey state machine
        ├── earth/             # Globe, morph geometry, lighting, starfield, easter eggs
        ├── map/               # MapLibre integration (+ dev-only alignment tool, press M)
        ├── ui/                # UIManager, modals, tooltips, touch handling
        ├── effects/           # Alternative design scene, easter egg controls
        ├── data/places.ts     # Places and photos shown on the map
        └── PlacesManager.ts   # Map markers, popups and places list
```

## 🛠️ Tech Stack

- **Build**: Vite, TypeScript
- **3D**: Three.js
- **Maps**: MapLibre GL JS with MapTiler
- **Panoramas**: Photo Sphere Viewer
- **Styling**: CSS (plus Tailwind for the alternative design)
- **Deployment**: GitHub Pages via GitHub Actions on push to `main`

## 📝 License

[GNU General Public License v3.0](LICENSE)
