import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';
import { join } from 'path';

export default defineConfig({
  // Set the root directory to 'public' since that's where your HTML and assets are
  root: 'public',
  
  plugins: [
    tailwindcss()
  ],
  
  // Configure the development server
  server: {
    port: 4001,
    host: '127.0.0.1',
    open: true
  },
  
  // Build configuration
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split Three.js into its own chunk
          if (id.includes('node_modules/three')) {
            return 'three';
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
      },
      plugins: [
        {
          name: 'copy-textures',
          writeBundle() {
            const srcDir = join(process.cwd(), 'public', 'textures');
            const destDir = join(process.cwd(), 'dist', 'textures');
            
            if (existsSync(srcDir)) {
              // Create destination directory
              mkdirSync(destDir, { recursive: true });
              
              // Copy all files recursively
              const copyRecursive = (src, dest) => {
                const fs = require('fs');
                const path = require('path');
                
                if (fs.statSync(src).isDirectory()) {
                  if (!existsSync(dest)) {
                    mkdirSync(dest, { recursive: true });
                  }
                  fs.readdirSync(src).forEach(file => {
                    copyRecursive(path.join(src, file), path.join(dest, file));
                  });
                } else {
                  copyFileSync(src, dest);
                }
              };
              
              copyRecursive(srcDir, destDir);
              console.log('✅ Copied textures folder to dist/');
            }
          }
        }
      ]
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['three', 'maplibregl'],
    exclude: ['@photo-sphere-viewer/core'] // Exclude from pre-bundling to allow dynamic imports
  }
});
