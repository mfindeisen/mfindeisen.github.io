import { defineConfig } from 'vite';

export default defineConfig({
  // Set the root directory to 'public' since that's where your HTML and assets are
  root: 'public',
  
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
    // Copy static assets from public directory
    copyPublicDir: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['three']
  }
});
