import axios, { AxiosInstance, InternalAxiosRequestConfig,AxiosError } from 'axios';
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

// Response Interceptor (Cập nhật logic Refresh Token)
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// 3. Cấu hình RESPONSE Interceptor (Nhận về - Tùy chọn nâng cao)
// Chức năng: Xử lý khi token hết hạn (401) hoặc lỗi chung
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Nếu lỗi 401 và chưa từng thử lại request này (_retry = undefined hoặc false)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Đánh dấu đã retry để tránh vòng lặp vô hạn

            try {
                // 1. Gọi API Refresh Token
                // Lưu ý: Không dùng instance 'api' ở đây để tránh loop nếu endpoint refresh cũng lỗi 401
                // Hoặc dùng axios.create riêng, nhưng ở đây ta dùng axios gốc
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    // Không có refresh token thì logout luôn
                    throw new Error("No refresh token");
                }

                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken
                });

                const { accessToken } = response.data;

                // 2. Lưu token mới
                localStorage.setItem('accessToken', accessToken);
                // Nếu backend trả về refresh token mới thì lưu luôn
                if (response.data.refreshToken) {
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                }

                // 3. Cập nhật header cho request cũ
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                // 4. Thực hiện lại request ban đầu với token mới
                return api(originalRequest);

            } catch (refreshError) {
                // Nếu refresh token cũng hết hạn hoặc không hợp lệ -> Logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;