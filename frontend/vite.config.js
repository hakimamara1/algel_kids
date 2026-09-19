import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import landingPages from './src/landings/landings.json'

// index.html starts loading a landing page's product before React starts: it needs slug -> product id
const landingProducts = () => ({
  name: 'landing-products',
  transformIndexHtml: (html) => html.replace(
    '__LANDING_PRODUCTS__',
    JSON.stringify(Object.fromEntries(Object.entries(landingPages).map(([slug, page]) => [slug, page.productId]))),
  ),
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    landingProducts(),
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
        // React, ReactDOM and the router rarely change: keep them in one long-cached chunk.
        // Everything else is left to Rollup, so admin-only libraries (axios) stay out of
        // the product page that ads land on.
        manualChunks: (id) => {
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
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


