import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Tải các biến môi trường dựa trên mode hiện tại (development/production)
    // process.cwd() trả về thư mục gốc của dự án
    // '' nghĩa là tải tất cả các biến (bao gồm cả biến không có tiền tố VITE_)
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            host: "::",
            port: 5173,
            allowedHosts: true,
            proxy: {
                // Proxy API requests to backend
                "/api": {
                    // Sử dụng biến env vừa tải được
                    target: env.VITE_API_BASE_URL || "http://localhost:8080",
                    changeOrigin: true,
                    secure: false,
                },
                // Proxy auth endpoints
                "/auth": {
                    target: env.VITE_API_BASE_URL || "http://localhost:8080",
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
        plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});