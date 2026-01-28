package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.SkuZoneConfigRequest;
import edu.uth.wms.dto.response.SkuZoneConfigResponse;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.SkuZoneConfig;
import edu.uth.wms.repository.ISkuZoneConfigRepository;
import edu.uth.wms.service.ISkuZoneConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkuZoneConfigServiceImpl implements ISkuZoneConfigService {

    private final ISkuZoneConfigRepository repository;

    @Override
    public List<SkuZoneConfigResponse> getAllConfigs() {
        return repository.findAll().stream()
                .map(SkuZoneConfigResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public SkuZoneConfigResponse getConfigById(Long id) {
        SkuZoneConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với ID: " + id));
        return SkuZoneConfigResponse.fromEntity(config);
    }

    @Override
    @Transactional
    public SkuZoneConfigResponse createConfig(SkuZoneConfigRequest request) {
        // Validate trùng lặp Prefix
        if (repository.existsBySkuPrefix(request.getSkuPrefix())) {
            throw new RuntimeException("Mã SKU Prefix '" + request.getSkuPrefix() + "' đã tồn tại!");
        }

        SkuZoneConfig config = SkuZoneConfig.builder()
                .skuPrefix(request.getSkuPrefix().toUpperCase()) // Luôn lưu in hoa
                .primaryZone(request.getPrimaryZone().toUpperCase())
                .backupZone(request.getBackupZone() != null ? request.getBackupZone().toUpperCase() : null)
                .build();

        SkuZoneConfig saved = repository.save(config);
        return SkuZoneConfigResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public SkuZoneConfigResponse updateConfig(Long id, SkuZoneConfigRequest request) {
        SkuZoneConfig config = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cấu hình với ID: " + id));

        // Kiểm tra nếu người dùng đổi Prefix mà Prefix mới lại trùng với cái khác đã có
        if (!config.getSkuPrefix().equalsIgnoreCase(request.getSkuPrefix()) &&
            repository.existsBySkuPrefix(request.getSkuPrefix())) {
            throw new RuntimeException("Mã SKU Prefix '" + request.getSkuPrefix() + "' đã tồn tại ở cấu hình khác!");
        }

        config.setSkuPrefix(request.getSkuPrefix().toUpperCase());
        config.setPrimaryZone(request.getPrimaryZone().toUpperCase());
        config.setBackupZone(request.getBackupZone() != null ? request.getBackupZone().toUpperCase() : null);

        SkuZoneConfig updated = repository.save(config);
        return SkuZoneConfigResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteConfig(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy cấu hình với ID: " + id);
        }
        repository.deleteById(id);
    }
}