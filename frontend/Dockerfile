# Sử dụng Node image (tương đồng với việc BE dùng Maven/Java image)
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ code vào (Dù sẽ bị Volume ghi đè, nhưng vẫn cần cho bước build image)
COPY . .

# Mở port
EXPOSE 5173

# Chạy lệnh Dev
CMD ["npm", "run", "dev", "--", "--host"]