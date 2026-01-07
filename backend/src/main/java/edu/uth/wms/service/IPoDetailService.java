package edu.uth.wms.service;

import edu.uth.wms.dto.response.PoDetailResponse;

import java.util.List;

public interface IPoDetailService {

    List<PoDetailResponse> getPODetailByPo(Long id);

    List<PoDetailResponse> getPODetailByPoIdforStaff(Long id);


}
