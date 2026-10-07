import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'path';

const page = (name) => join(process.cwd(), 'public', `${name}.html`);

export default defineConfig(({ command }) => ({
  // Set the root directory to 'public' since that's where your HTML and assets are
  root: 'public',

  // Copied unchanged to the site root: textures loaded at runtime, og-image, favicon, robots.txt, sitemap.xml
  publicDir: 'static',
  
  plugins: [
    tailwindcss()
  ],
  
  // Configure the development server
  server: {
    port: 4001,
    host: '127.0.0.1',
    open: true
  },
  
  // Strip debug logging from production bundles; warnings and errors are kept
  esbuild: command === 'build' ? { pure: ['console.log', 'console.trace'] } : {},

  // Build configuration
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      input: {
        main: page('index'),
        impressum: page('impressum'),
        datenschutz: page('datenschutz')
      },
      output: {
        manualChunks: (id) => {
          // Split Three.js into its own chunk
          if (id.includes('node_modules/three')) {
            return 'three';
          }
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre';
          }
          // Split photo sphere viewer into its own chunk
          if (id.includes('node_modules/@photo-sphere-viewer')) {
            return 'photo-sphere-viewer';
          }
          // Split other large vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['three'],
    exclude: ['@photo-sphere-viewer/core'] // Exclude from pre-bundling to allow dynamic imports
  }
}));
