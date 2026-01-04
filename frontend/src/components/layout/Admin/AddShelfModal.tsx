import React, { useState } from 'react';
import { locationService } from '../../../services/wms.Service';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddShelfModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        zoneCode: '',
        shelfCode: '',
        totalLevels: 1
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await locationService.createShelf(formData);
            alert("Tạo kệ thành công!");
            onSuccess();
        } catch (error) {
            alert("Lỗi khi tạo kệ. Vui lòng kiểm tra lại.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-96 p-6">
                <h3 className="text-lg font-bold mb-4">Thêm Kệ Mới</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mã Khu Vực (Zone)</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="VD: A"
                            className="mt-1 block w-full border rounded p-2 uppercase"
                            value={formData.zoneCode}
                            onChange={e => setFormData({...formData, zoneCode: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mã Kệ (Shelf)</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="VD: S01"
                            className="mt-1 block w-full border rounded p-2 uppercase"
                            value={formData.shelfCode}
                            onChange={e => setFormData({...formData, shelfCode: e.target.value.toUpperCase()})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Số Tầng (Levels)</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="20"
                            required 
                            className="mt-1 block w-full border rounded p-2"
                            value={formData.totalLevels}
                            onChange={e => setFormData({...formData, totalLevels: parseInt(e.target.value)})}
                        />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {loading ? 'Đang tạo...' : 'Xác Nhận'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddShelfModal;