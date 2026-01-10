package edu.uth.wms.service;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.enums.PickingAlgorithmType;

import java.util.List;

// ========================================
// 1. SYSTEM CONFIG SERVICE INTERFACE
// ========================================
public interface ISystemConfigService {
    SystemConfigResponse getCurrentConfig();
    SystemConfigResponse updateAlgorithm(String username, UpdateAlgorithmRequest request);
    PickingAlgorithmType getCurrentAlgorithm(); // Dùng nội bộ
}

