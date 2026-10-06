# Interactive Earth Portfolio

Live: [mfindeisen.github.io](https://mfindeisen.github.io)

This is the portfolio site of Matthias Findeisen. It opens on a 3D Earth. Scrolling turns the globe into a cube, unfolds the cube into a flat net and zooms into it until it becomes an interactive MapLibre map. The map then flies to Erbil, Iraq, where the portfolio and showcase open.

## Features

- A 3D Earth built with Three.js, using NASA textures, clouds, an atmosphere and sun lighting.
- The real night sky behind it: the ~9,100 stars of the Yale Bright Star Catalog at their true positions, brightnesses and colours, over ESO's photographic panorama of the Milky Way, aligned to the catalogue. The view faces the Galactic centre.
- A scroll-driven transition from sphere to cube to unfolded net. The net lines up with the projection of the map that replaces it.
- A MapLibre GL map (MapTiler tiles) with a flight to Erbil and a list of places, each with photo galleries and 360° panoramas.
- Portfolio and showcase overlays covering experience, skills and selected projects, among them the open-source RTI toolset, HumanitySync and KurdîHub.
- Accessibility basics: keyboard-operable dialogs (Esc closes them, focus stays trapped inside) and support for `prefers-reduced-motion`.
- A few hidden extras. Press `H` on the start screen to list them.

## Getting started

The project uses [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/mfindeisen/mfindeisen.github.io.git
cd mfindeisen.github.io
pnpm install
pnpm run dev
```

Other scripts:

```bash
pnpm run build      # production build into dist/
pnpm run preview    # serve the production build
pnpm run typecheck  # TypeScript type check
pnpm run build:sky  # regenerate public/textures/sky/ from the star catalogue and the Milky Way panorama
```

### MapTiler API key

The MapTiler key in `App.ts` is restricted to `mfindeisen.github.io`. For local development, put your own key in `public/.env.local`. Vite uses `public/` as its root, so it reads env files from there.

```bash
VITE_MAPTILER_LOCAL_API_KEY=your-key
```

Without a key, the globe and the overlays still work locally, but the map stays empty.

## How it works

1. At the top of the page, the Earth rotates with day and night lighting.
2. Scrolling down morphs the sphere into a cube and unfolds it into a flat net.
3. The camera zooms into the net until it matches the start view of the map, and the map takes over.
4. The map flies to Erbil.
5. The portfolio opens and the list of places becomes available.

The Showcase and Portfolio buttons skip the journey and open the overlays directly.

The transition style can be chosen with the `morph` URL parameter:

| Value | Effect |
| --- | --- |
| `cube-zoom` (default) | Cube unfolds, then zooms into the map |
| `cube-fade` | Cube unfolds, then crossfades into a flat plane |
| `classic` | The original peel from sphere to plane |

Example: `https://mfindeisen.github.io/?morph=classic`

## Project structure

```
mfindeisen.github.io/
├── vite.config.js             # Vite config (root is public/)
├── package.json
├── scripts/build-sky.mjs      # Builds the star catalogue and Milky Way assets
└── public/
    ├── index.html             # Entry point, overlays and meta tags
    ├── style.css              # Global styles
    ├── showcase/              # Media for the showcase cards
    ├── textures/              # Earth textures and place photos
    └── src/
        ├── main.ts            # Bootstrap
        ├── core/App.ts        # Scroll and journey state
        ├── earth/             # Globe, morph geometry, cube unfold, lighting, starfield
        ├── map/               # MapLibre integration
        ├── ui/                # Overlays, modals, tooltips, touch handling
        ├── effects/           # Easter eggs and the scene for the alternative design
        ├── data/places.ts     # Places and photos shown on the map
        └── PlacesManager.ts   # Map markers, popups and the places list
```

## Tech stack

- Vite and TypeScript
- Three.js
- MapLibre GL JS with MapTiler
- Photo Sphere Viewer for the panoramas
- Plain CSS
- GitHub Pages, deployed by GitHub Actions on every push to `main`

## Credits

- Milky Way: [ESO/S. Brunier](https://www.eso.org/public/images/eso0932a/), CC BY 4.0, reprojected to equatorial coordinates.
- Stars: Yale Bright Star Catalog, 5th revised edition (Hoffleit & Warren), via [brettonw/YaleBrightStarCatalog](https://github.com/brettonw/YaleBrightStarCatalog).

## License

[GNU General Public License v3.0](LICENSE)
