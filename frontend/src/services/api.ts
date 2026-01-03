// src/services/api.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Khởi tạo instance Axios với cấu hình mặc định
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',

        //! BẮT BUỘC PHẢI CÓ DÒNG NÀY KHI DÙNG NGROK MIỄN PHÍ
        'ngrok-skip-browser-warning': 'true'
    },
    withCredentials: true, // Quan trọng: Cho phép gửi/nhận Cookie (RefreshToken)
    timeout: 10000,
});

// --- CƠ CHẾ HÀNG ĐỢI (QUEUE) ---
// Biến cờ để đánh dấu quá trình refresh token đang diễn ra
let isRefreshing = false;
// Hàng đợi lưu các request bị lỗi 401 trong khi đang refresh token
let failedQueue: any[] = [];

/**
 * Hàm xử lý hàng đợi sau khi refresh token xong (thành công hoặc thất bại)
 * @param error Lỗi nếu refresh thất bại
 * @param token AccessToken mới nếu refresh thành công
 */
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// --- 1. REQUEST INTERCEPTOR ---
// Tự động đính kèm AccessToken vào Header của mọi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- 2. RESPONSE INTERCEPTOR ---
// Xử lý tự động Refresh Token khi gặp lỗi 401
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Kiểm tra điều kiện để kích hoạt Refresh Token:
        // 1. Lỗi là 401 (Unauthorized)
        // 2. Request này chưa từng được retry (tránh lặp vô tận)
        // 3. Không phải là request login (để tránh loop khi login sai)
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            // Trường hợp A: Đang có một tiến trình refresh token khác chạy
            // -> Đẩy request này vào hàng đợi để chờ token mới
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            // Trường hợp B: Chưa có tiến trình refresh nào -> Bắt đầu refresh
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API Refresh Token (Token lấy từ HttpOnly Cookie)
                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true
                });

                const { accessToken } = res.data;

                // Lưu token mới vào LocalStorage
                localStorage.setItem("accessToken", accessToken);

                // Cập nhật token cho instance axios hiện tại và request đang bị lỗi
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                // Xử lý các request đang chờ trong hàng đợi
                processQueue(null, accessToken);

                // Gửi lại request ban đầu
                return api(originalRequest);

            } catch (refreshError) {
                // Nếu refresh thất bại (Cookie hết hạn hoặc không hợp lệ)
                processQueue(refreshError, null);

                // Xóa token rác và điều hướng về trang Login
                localStorage.removeItem("accessToken");
                window.location.href = "/login";

                return Promise.reject(refreshError);
            } finally {
                // Kết thúc quá trình refresh, dù thành công hay thất bại
                isRefreshing = false;
            }
        }

        // Nếu lỗi không phải 401 hoặc không thể cứu vãn, trả về lỗi gốc
        return Promise.reject(error);
    }
);

export default api;