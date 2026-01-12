// package edu.uth.wms.config;

// import org.springframework.context.annotation.Configuration;
// import
// org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// @Configuration
// public class MvcConfig implements WebMvcConfigurer {

// @Override
// public void addResourceHandlers(ResourceHandlerRegistry registry) {
// // Cấu hình: Khi gọi URL /api/uploads/**
// // -> Sẽ tìm file trong thư mục vật lý ../uploads/

// registry.addResourceHandler("/api/uploads/**")
// .addResourceLocations("file:Warehouse-Management-System/uploads/");
// }
// }