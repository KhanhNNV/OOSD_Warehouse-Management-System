package edu.uth.wms.service.impl;

import org.springframework.stereotype.Service;


import edu.uth.wms.repository.IInboundNoteRepository;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.IInboundNoteService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InboundNoteServiceImpl implements IInboundNoteService{
    private final IInboundNoteRepository inboundNoteRepository;
    private final IPurchaseOrderRepository purchaseOrderRepository; // Cần repo này để lấy PO
    private final IUserRepository userRepository;

    // Hàm create or get phiếu nhập cho (Inbound)
    


    //Hàm create
    private InboundNote getU
}
