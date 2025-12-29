import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Tạo instance của Axios
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL, // URL Backend của bạn
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// 2. Cấu hình REQUEST Interceptor (Gửi đi)
// Chức năng: Tự động lấy token từ storage và gắn vào header mỗi lần gọi API
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Lấy token từ LocalStorage
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            // Gắn token vào header Authorization theo chuẩn Bearer
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Cấu hình RESPONSE Interceptor (Nhận về - Tùy chọn nâng cao)
// Chức năng: Xử lý khi token hết hạn (401) hoặc lỗi chung
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Nếu server trả về 401 (Unauthorized), có thể logout hoặc refresh token
            // Ví dụ: Xóa token và redirect về login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            // window.location.href = '/login'; // Bỏ comment nếu muốn redirect cứng
        }
        return Promise.reject(error);
    }
);

export default api;