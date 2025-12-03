import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: './dist',
    sourcemap: false, // Disable sourcemaps in production
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching - avoid firebase-specific chunks that cause issues
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings for large chunks
  },
  define: {
    // Only define specific environment variables needed, not the entire process.env
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  server: {
    open: true, // Automatically open browser on dev start
    port: 5173, // Default Vite port
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'leaflet', 
      'react-leaflet',
      'react-toastify',
      'lucide-react'
    ],
  }
});
