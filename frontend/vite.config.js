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
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'ui-vendor': ['react-toastify', 'lucide-react'],
          'firebase-vendor': ['firebase'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings for large chunks
  },
  define: {
    // Define environment variables for production
    'process.env': process.env,
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
    include: ['react', 'react-dom', 'react-router-dom'],
  }
});
