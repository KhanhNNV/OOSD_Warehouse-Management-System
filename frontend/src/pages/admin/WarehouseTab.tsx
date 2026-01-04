import React, { useEffect, useState } from 'react';
import { locationService, barcodeService } from '../../services/wms.Service';
import { LocationData, ZoneResponse } from '../../types/wms';
import { useWarehouseFilter } from '../../hooks/useWarehouseFilter';
import PrintModal, {PrintItem} from '../../components/layout/Admin/PrintModal';
import AddShelfModal from '../../components/layout/Admin/AddShelfModal'; // (Giả sử bạn đã tạo file này tương tự PrintModal)
import { Printer, Trash2, Plus, Search, Filter, RefreshCw } from 'lucide-react';


const WarehouseTab: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);

  const { searchText, setSearchText, filterZone, setFilterZone, filterShelf, setFilterShelf, filteredData } = useWarehouseFilter(locations);

  const fetchData = async () => {
    setLoading(true);
    try {
      const codes = await locationService.getAllLocationCodes();
      const parsedData: LocationData[] = codes.map((code, index) => {
        const parts = code.split('-');
        return {
          id: index,
          code: code,
          zone: parts[0] || '?',
          shelf: parts[1] || '?',
          cell: parts[2] || '?',
          isFull: null 
        };
      });
      parsedData.sort((a, b) => a.code.localeCompare(b.code));
      setLocations(parsedData);
      
      const zonesRes = await locationService.getZones();
      setZones(zonesRes);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allVisibleCodes = new Set(filteredData.map(d => d.code));
      setSelectedCodes(allVisibleCodes);
    } else {
      setSelectedCodes(new Set());
    }
  };

  const handleSelectRow = (code: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) { newSelected.delete(code); } 
    else { newSelected.add(code); }
    setSelectedCodes(newSelected);
  };

  const handlePrintSingle = async (code: string) => {
    try {
        const base64 = await barcodeService.generateBarcode(code);
        setPrintItems([{ code, base64 }]);
        setIsPrintModalOpen(true);
    } catch (e) { alert("Lỗi khi tạo mã vạch"); }
  };

  const handleBulkPrint = async () => {
    if (selectedCodes.size === 0) return;
    setActionLoading(true);
    try {
        const codesToPrint = Array.from(selectedCodes);
        const promises = codesToPrint.map(async (code) => {
            try {
                const base64 = await barcodeService.generateBarcode(code);
                return { code, base64 };
            } catch (error) { return null; }
        });
        const results = await Promise.all(promises);
        const validResults = results.filter((item): item is PrintItem => item !== null);
        if (validResults.length > 0) {
            setPrintItems(validResults);
            setIsPrintModalOpen(true);
        }
    } catch (error) { alert("Có lỗi xảy ra"); } finally { setActionLoading(false); }
  };

  // === CẬP NHẬT LOGIC XÓA (Xóa từng item) ===
  const handleBulkDelete = async () => {
    if (selectedCodes.size === 0) return;
    
    // Cảnh báo rõ ràng hơn
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn ${selectedCodes.size} vị trí đã chọn?`)) return;

    setActionLoading(true);
    try {
      const codesToDelete = Array.from(selectedCodes);
      
      // Gọi API xóa từng item song song
      await Promise.all(codesToDelete.map(code => locationService.deleteLocation(code)));

      alert("Đã xóa thành công!");
      fetchData();
      setSelectedCodes(new Set());
    } catch (error: any) {
        console.error(error);
        // Thông báo lỗi cụ thể nếu Backend trả về message
        if (error.response?.data?.message) {
            alert("Lỗi: " + error.response.data.message);
        } else {
            alert("Có lỗi khi xóa (Có thể vị trí đang chứa hàng hoặc lỗi mạng).");
        }
    } finally {
        setActionLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Quản Lý Kho Hàng</h1>
           <p className="text-sm text-gray-500">Tổng: {locations.length} | Hiển thị: {filteredData.length}</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center gap-2">
            <Plus size={18} /> Thêm Kệ Mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="text" placeholder="Tìm mã, kệ, ô (VD: 01)..." 
                    className="pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none w-64"
                    value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
            {/* <div className="flex items-center gap-2 border-l pl-4">
                <Filter size={18} className="text-gray-500" />
                <select className="border rounded px-3 py-2 outline-none" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">Tất cả Khu</option>
                    {zones.map(z => <option key={z.zoneCode} value={z.zoneCode}>{z.zoneCode}</option>)}
                </select>
            </div> */}
            <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw size={18} className={loading ? "animate-spin text-blue-500" : "text-gray-500"} /></button>
        </div>

        {selectedCodes.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded border border-blue-100">
                <span className="text-sm font-medium text-blue-800">Đã chọn {selectedCodes.size} ô</span>
                <div className="h-4 w-[1px] bg-blue-200 mx-2"></div>
                <button onClick={handleBulkPrint} disabled={actionLoading} className="text-gray-600 hover:text-blue-600 flex items-center gap-1 text-sm font-medium disabled:opacity-50">
                    <Printer size={16} /> {actionLoading ? '...' : 'In đã chọn'}
                </button>
                <button onClick={handleBulkDelete} disabled={actionLoading} className="text-gray-600 hover:text-red-600 flex items-center gap-1 text-sm font-medium disabled:opacity-50">
                    <Trash2 size={16} /> Xóa
                </button>
            </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="p-4 w-10"><input type="checkbox" onChange={handleSelectAll} checked={filteredData.length > 0 && selectedCodes.size === filteredData.length} /></th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">STT</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Kho</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Kệ</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Ô (Vị trí)</th>
                        {/* <th className="p-4 font-semibold text-gray-600 text-sm text-center">Mã Đầy Đủ</th> */}
                        <th className="p-4 font-semibold text-gray-600 text-sm text-center">Trạng Thái</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-center">Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? ( <tr><td colSpan={8} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr> ) : 
                    filteredData.length === 0 ? ( <tr><td colSpan={8} className="p-8 text-center text-gray-500">Không tìm thấy dữ liệu.</td></tr> ) : (
                        filteredData.map((item, index) => (
                            <tr key={item.code} className="border-b hover:bg-gray-50 transition">
                                <td className="p-4"><input type="checkbox" checked={selectedCodes.has(item.code)} onChange={() => handleSelectRow(item.code)} /></td>
                                <td className="p-4 text-gray-500">{index + 1}</td>
                                <td className="p-4 font-medium text-gray-800">{item.zone}</td>
                                <td className="p-4 text-gray-600">{item.shelf}</td>
                                <td className="p-4"><span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.cell}</span></td>
                                {/* <td className="p-4 text-center text-gray-400 text-sm font-mono">{item.code}</td> */}
                                <td className="p-4 text-center"><span className={`inline-block w-3 h-3 rounded-full ${item.isFull ? 'bg-red-500' : 'bg-green-500'}`} title={item.isFull ? 'Đã đầy' : 'Còn trống'}></span></td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handlePrintSingle(item.code)} className="text-gray-500 hover:text-blue-600 transition p-2 rounded hover:bg-blue-50"><Printer size={18} /></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
      <PrintModal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} items={printItems} />
      {isAddModalOpen && <AddShelfModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); fetchData(); }} />}
    </div>
  );
};

export default WarehouseTab;