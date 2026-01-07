package edu.uth.wms.service.impl;

import edu.uth.wms.dto.response.PoDetailResponse;
import edu.uth.wms.model.PurchaseOrder;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.service.IPoDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class IPoDetailServiceImpl implements IPoDetailService {

    private final IPurchaseOrderRepository purchaseOrderRepository;

    @Override
    public List<PoDetailResponse> getPODetailByPo(Long poId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không thấy PO"));

        if (po.getDetails() == null)
            return new ArrayList<>();

        return po.getDetails().stream()
                .map(d -> PoDetailResponse.builder()
                        .productId(d.getProduct().getId())
                        .productName(d.getProduct().getName())
                        .productSku(d.getProduct().getSku())
                        .expectedQty(d.getExpectedQty())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<PoDetailResponse> getPODetailByPoIdforStaff(Long poId) {
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không thấy PO"));

        if (po.getDetails() == null)
            return new ArrayList<>();

        return po.getDetails().stream()
                .map(d -> PoDetailResponse.builder()
                        .productId(d.getProduct().getId())
                        .productName(d.getProduct().getName())
                        .productSku(d.getProduct().getSku())
                        .build())
                .collect(Collectors.toList());
    }
}
