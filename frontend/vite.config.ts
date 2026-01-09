// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";
// import basicSsl from '@vitejs/plugin-basic-ssl';
//
// export default defineConfig(({ mode }) => {
//     // Load toàn bộ biến môi trường
//     const env = loadEnv(mode, process.cwd(), '');
//
//     // Lấy địa chỉ backend từ .env, nếu không có thì mặc định là localhost:8080
//     const targetUrl = env.VITE_API_BASE_URL || "http://localhost:8080";
//
//     return {
//         server: {
//             host: true,
//             port: 5173,
//             allowedHosts: true,
//             // HTTPS được bật bởi plugin basicSsl bên dưới
//
//             proxy: {
//                 "/api": {
//                     target: targetUrl,
//                     changeOrigin: true,
//                     secure: false,
//                     // --- THÊM ĐOẠN NÀY ---
//                     // Ép header Origin thành địa chỉ của Backend
//                     // Để Spring Boot không chặn CORS
//                     configure: (proxy, _options) => {
//                         proxy.on('proxyReq', (proxyReq, req, _res) => {
//                             proxyReq.setHeader('Origin', targetUrl);
//                         });
//                     },
//                 },
//                 "/auth": {
//                     target: targetUrl,
//                     changeOrigin: true,
//                     secure: false,
//                     // --- THÊM ĐOẠN NÀY TƯƠNG TỰ ---
//                     configure: (proxy, _options) => {
//                         proxy.on('proxyReq', (proxyReq, req, _res) => {
//                             proxyReq.setHeader('Origin', targetUrl);
//                         });
//                     },
//                 },
//             },
//         },
//         plugins: [
//             react(),
//             basicSsl(),
//             mode === "development" && componentTagger()
//         ].filter(Boolean),
//         resolve: {
//             alias: {
//                 "@": path.resolve(__dirname, "./src"),
//             },
//         },
//     };
// });
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
    // Load toàn bộ biến môi trường
    const env = loadEnv(mode, process.cwd(), '');

    // Lấy địa chỉ backend từ .env, nếu không có thì mặc định là localhost:8080
    const targetUrl = env.VITE_API_BASE_URL || "http://localhost:8080";

    return {
        server: {
            host: true,
            port: 5173,
            allowedHosts: true,
            // HTTPS được bật bởi plugin basicSsl bên dưới

            // BẮT BUỘC ĐỂ DOCKER TRÊN WINDOWS NHẬN DIỆN SỬA CODE ---
            watch: {
                usePolling: true,
            },

            // Cấu hình Proxy
            proxy: {
                "/api": {
                    target: targetUrl,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            proxyReq.setHeader('Origin', targetUrl);
                        });
                    },
                },
                "/auth": {
                    target: targetUrl,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            proxyReq.setHeader('Origin', targetUrl);
                        });
                    },
                },
                // --- BỔ SUNG QUAN TRỌNG: PROXY CHO INBOUND ---
                "/inbound": {
                    target: targetUrl,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            proxyReq.setHeader('Origin', targetUrl);
                        });
                    },
                },
                // --- BỔ SUNG LUÔN CHO OUTBOUND (Dự phòng) ---
                "/outbound": {
                    target: targetUrl,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            proxyReq.setHeader('Origin', targetUrl);
                        });
                    },
                },
            },
        },
        plugins: [
            react(),
            basicSsl(),
            mode === "development" && componentTagger()
        ].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});