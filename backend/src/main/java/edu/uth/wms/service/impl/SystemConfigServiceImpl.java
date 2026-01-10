package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.UpdateAlgorithmRequest;
import edu.uth.wms.dto.response.SystemConfigResponse;
import edu.uth.wms.model.SystemConfig;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.PickingAlgorithmType;
import edu.uth.wms.repository.ISystemConfigRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.ISystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SERVICE QUẢN LÝ CẤU HÌNH HỆ THỐNG
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemConfigServiceImpl implements ISystemConfigService {

    private final ISystemConfigRepository configRepo;
    private final IUserRepository userRepo;

    /**
     * Lấy cấu hình hiện tại
     */
    @Override
    public SystemConfigResponse getCurrentConfig() {
        SystemConfig config = getOrCreateConfig();
        
        return SystemConfigResponse.builder()
            .currentAlgorithm(config.getPickingAlgorithm().name())
            .updatedBy(config.getUpdatedBy() != null ? config.getUpdatedBy().getUsername() : "System")
            .updatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt().toString() : null)
            .build();
    }

    /**
     * Admin cập nhật thuật toán xuất kho
     */
    @Override
    @Transactional
    public SystemConfigResponse updateAlgorithm(String username, UpdateAlgorithmRequest request) {
        // 1. Validate thuật toán
        PickingAlgorithmType newAlgorithm;
        try {
            newAlgorithm = PickingAlgorithmType.valueOf(request.getAlgorithm().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Thuật toán không hợp lệ. Chỉ chấp nhận: FIFO hoặc FEFO");
        }

        // 2. Lấy user hiện tại
        User admin = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // 3. Cập nhật config
        SystemConfig config = getOrCreateConfig();
        config.setPickingAlgorithm(newAlgorithm);
        config.setUpdatedBy(admin);
        config.setUpdatedAt(LocalDateTime.now());
        
        configRepo.save(config);

        log.info("✅ Admin {} đã thay đổi thuật toán xuất kho thành: {}", username, newAlgorithm);

        return getCurrentConfig();
    }

    /**
     * Helper: Lấy hoặc tạo config mới (nếu chưa có)
     */
    private SystemConfig getOrCreateConfig() {
        return configRepo.findCurrentConfig()
            .orElseGet(() -> {
                SystemConfig newConfig = SystemConfig.builder()
                    .pickingAlgorithm(PickingAlgorithmType.FIFO) // Mặc định FIFO
                    .updatedAt(LocalDateTime.now())
                    .build();
                return configRepo.save(newConfig);
            });
    }

    /**
     * Lấy thuật toán hiện tại (dùng nội bộ)
     */
    @Override
    public PickingAlgorithmType getCurrentAlgorithm() {
        return getOrCreateConfig().getPickingAlgorithm();
    }
}