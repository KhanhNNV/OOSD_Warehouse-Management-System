# OOSD_Warehouse-Management-System
![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-green?style=for-the-badge&logo=spring)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)

Xây dựng hệ thống WMS (Warehouse Management System): Quản lý vị trí lưu kho, nhập kho, xuất kho, kiểm kê và mã vạch.

## 🚀 Hướng Dẫn Cài Đặt 

### 🐳 Sử dụng Docker (Khuyên dùng)

Đây là cách nhanh nhất để khởi chạy toàn bộ hệ thống (Database + Backend + Frontend) mà không cần cài đặt môi trường phức tạp.

**Trường hợp:** Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).

**Bước 1:** Clone dự án và di chuyển vào thư mục gốc.
```bash
git clone https://github.com/KhanhNNV/OOSD_Warehouse-Management-System.git
cd project-wms
```

**Bước 2:** Setup file môi trường (Nếu chưa có). Tạo các file quan trọng 
```bash
BE application-dev.properties có SERVER_PORT, DB_URL, DB_USERNAME, DB_PASSWORD, SECRETKEY_JWT
FE .env có VITE_APP_NAME và  VITE_API_BASE_URL
Và .env trong thư mục gốc: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, DB_PORT, BACKEND_PORT, JDK_VERSION, FRONTEND_PORT, JDK_VERSION
```

**Bước 3:** Chạy lệnh khởi tạo.
```bash
docker-compose up -d --build
```

**Trường hợp:** Chưa cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/).

Chỉnh sửa VITE_API_BASE_URL trong .env của FE dùng localhost thay vì wms-backend 
