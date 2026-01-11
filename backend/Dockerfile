# Nhận biến JDK_VERSION từ docker-compose
# Mặc định là 21 nếu không truyền vào (để an toàn cho các thành viên khác)
ARG JDK_VERSION=21

# Dùng biến JDK_VERSION để chọn Image tương ứng (21 hoặc 22)
FROM maven:3.9-eclipse-temurin-${JDK_VERSION}

WORKDIR /app

# Copy pom.xml và tải thư viện (để tận dụng Cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Lưu ý: Không cần COPY src vì đã mount volume ở docker-compose

EXPOSE 8080

# Chạy lệnh Maven để hỗ trợ Hot Reload
CMD ["mvn", "spring-boot:run"]