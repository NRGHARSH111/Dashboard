import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxImportSource: 'react'
    })
  ],
  
  // Performance optimizations
  server: {
    // Reduce HMR overhead
    hmr: {
      overlay: false, // Disable error overlay for better performance
      port: 5173 // Fixed port to prevent port scanning
    },
    // Disable file watching for better performance
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**', '**/git/**']
    },
    // Reduce CPU usage
    fs: {
      strict: false
    }
  },
  
  // Build optimizations
  build: {
    // Minify for better performance
    minify: 'esbuild',
    // Reduce chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          utils: ['framer-motion']
        }
      }
    }
  },
  
  // Enable source maps in development for better debugging
  css: {
    devSourcemap: true
  },
  
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: ['react', 'react-dom', 'lucide-react', 'framer-motion'],
    // Exclude problematic dependencies
    exclude: ['html2canvas', 'jspdf']
  }
})
