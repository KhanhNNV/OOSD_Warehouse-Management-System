// package edu.uth.wms.service.utils;

// import java.io.IOException;
// import java.net.MalformedURLException;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;
// import java.nio.file.StandardCopyOption;
// import java.util.stream.Stream;

// import org.springframework.core.io.Resource;
// import org.springframework.core.io.UrlResource;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// @Service
// public class FileStorageService {

// private final Path rootLocation = Paths.get("uploads");

// public FileStorageService() {
// try {
// Files.createDirectories(rootLocation);
// } catch (IOException e) {
// throw new RuntimeException("Could not initialize folder for upload!", e);
// }
// }

// // Lưu file
// public String storeFile(MultipartFile file) {
// try {
// String fileName = System.currentTimeMillis() + "_" +
// file.getOriginalFilename();
// Files.copy(file.getInputStream(), this.rootLocation.resolve(fileName),
// StandardCopyOption.REPLACE_EXISTING);
// return fileName; // Trả về tên file để lưu vào DB
// } catch (IOException e) {
// throw new RuntimeException("Failed to store file " +
// file.getOriginalFilename(), e);
// }
// }

// // Load file để hiển thị/download
// public Resource loadFile(String filename) {
// try {
// Path file = rootLocation.resolve(filename).normalize();
// Resource resource = new UrlResource(file.toUri());
// if (resource.exists() && resource.isReadable()) {
// return resource;
// } else {
// throw new RuntimeException("File not found or not readable: " + filename);
// }
// } catch (MalformedURLException e) {
// throw new RuntimeException("Error loading file: " + filename, e);
// }
// }

// // Xóa file
// public boolean deleteFile(String filename) {
// try {
// Path file = rootLocation.resolve(filename).normalize();
// return Files.deleteIfExists(file);
// } catch (IOException e) {
// throw new RuntimeException("Could not delete file: " + filename, e);
// }
// }

// // Liệt kê tất cả file trong thư mục uploads
// public Stream<Path> listAllFiles() {
// try {
// return Files.walk(this.rootLocation, 1).filter(path ->
// !path.equals(this.rootLocation))
// .map(this.rootLocation::relativize);
// } catch (IOException e) {
// throw new RuntimeException("Could not list files!", e);
// }
// }
// }