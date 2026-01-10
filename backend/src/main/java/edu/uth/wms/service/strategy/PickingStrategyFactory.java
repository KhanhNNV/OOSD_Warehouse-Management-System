package edu.uth.wms.service.strategy;

import edu.uth.wms.model.enums.PickingAlgorithmType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * FACTORY CLASS - CHỌN THUẬT TOÁN XUẤT KHO
 * 
 * Nhiệm vụ: Dựa vào cấu hình hệ thống, trả về Strategy tương ứng
 */
@Component
@RequiredArgsConstructor
public class PickingStrategyFactory {

    private final FifoPickingStrategy fifoStrategy;
    private final FefoPickingStrategy fefoStrategy;

    /**
     * Lấy thuật toán theo loại
     * 
     * @param algorithmType Loại thuật toán (FIFO hoặc FEFO)
     * @return Strategy tương ứng
     */
    public PickingStrategy getStrategy(PickingAlgorithmType algorithmType) {
        return switch (algorithmType) {
            case FIFO -> fifoStrategy;
            case FEFO -> fefoStrategy;
        };
    }
}