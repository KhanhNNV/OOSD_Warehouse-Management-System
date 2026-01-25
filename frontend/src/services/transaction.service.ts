import api from './api';
import { InventoryTransaction, TransactionParams } from '../types/transaction';

const BASE_URL = '/api/admin/transactions';

export const transactionService = {
    getAll: async (params: TransactionParams) => {
        // Axios tự động serialize params object thành query string
        const response = await api.get<{ content: InventoryTransaction[], totalPages: number, totalElements: number }>(BASE_URL, { params });
        return response.data;
    }
};