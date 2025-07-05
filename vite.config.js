import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Fantastic Task",
        short_name: "Tasks",
        description: "En oppgaveapp med gamification og statistikk",
        theme_color: "#82bcf4",
        background_color: "#ffffff",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "/task-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/task-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
