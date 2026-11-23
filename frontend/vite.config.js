import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests from the browser are forwarded to the Python backend.
      // This completely eliminates CORS preflight issues.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
