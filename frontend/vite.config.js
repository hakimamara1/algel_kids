import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Add bundle visualizer in analyze mode
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),

  build: {
    // Target modern browsers to reduce bundle size and polyfills
    target: 'es2020',

    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 300,

    // Enable CSS code splitting for better caching
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and smaller bundles
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Framer Motion (heavy animation library)
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Swiper (carousel library)
            if (id.includes('swiper')) {
              return 'vendor-swiper';
            }
            // Router
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            // Axios
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            // Other vendor libraries
            return 'vendor-other';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        passes: 2, // Run minification twice for better results
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb

    // Enable module preload for better loading
    modulePreload: {
      polyfill: true,
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
}))


