import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
    return {
        server: {
            host: "::",
            port: 8080,
        },
        plugins: [
            react(),
            mode === "development" && componentTagger(),
            VitePWA({
                registerType: "autoUpdate",
                includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
                manifest: {
                    name: "VIDA360 - Gestão de Vida Pessoal",
                    short_name: "VIDA360",
                    description: "Gerencie metas, hábitos, tarefas e finanças em um só lugar",
                    theme_color: "#6366f1",
                    background_color: "#0f172a",
                    display: "standalone",
                    icons: [
                        { src: "/pwa-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
                        { src: "/pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
                        { src: "/pwa-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
                    ],
                },
                workbox: {
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/qkljrdguejcflppumenc\.supabase\.co\/rest\/v1\/.*/,
                            handler: 'StaleWhileRevalidate',
                            options: {
                                cacheName: 'supabase-api-cache',
                                expiration: {
                                    maxEntries: 100,
                                    maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                                },
                            },
                        },
                    ],
                },
            }),
        ].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
