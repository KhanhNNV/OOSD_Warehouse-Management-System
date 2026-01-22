import api from "./api";

import {
    StocktakeSession,
    StocktakeShelfAssignment,
    SubmitCountsRequest
} from "@/types/stocktake";

export const stocktakeService = {
    //- Lấy danh sách việc làm (Các kệ đang OPEN hoặc của chính staff đó)
    getStaffAssignments: async ()=>{
        const res = await api.get<StocktakeShelfAssignment>('/api/stocktake/assignments');
        return res.data;
    },

    //- Staff chọn 1 shelf làm việc
    startAssignment: async (assignmentId: number)=>{
        const res = await api.post(`/api/stocktake/assignments/${assignmentId}/start`);
        return res.data;
    },


    //- Submit tất cả sản phẩm ở shelf
    submitAssignment: async (items: SubmitCountsRequest)=>{
        const res = await api.post(`/api/stocktake/assignments/submit`, items);
        return res.data;
    }





    //====================Manager=======================//
    //1. Create new Stocktake session
    createStocktake: async () =>{
        
    }
}