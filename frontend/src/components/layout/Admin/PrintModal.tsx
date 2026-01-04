import React, { useRef } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';

export interface PrintItem {
  code: string;
  base64: string;
}

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PrintItem[];
}

const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, items }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || items.length === 0) return null;

  // 1. Logic In (Mở cửa sổ in trình duyệt)
  const handlePrint = () => {
    openPrintWindow();
  };

  // 2. Logic Tải PNG (Tải từng ảnh hoặc ảnh đầu tiên nếu nhiều)
  const handleDownloadPNG = () => {
    if (items.length > 1) {
        if(!window.confirm(`Bạn đang chọn ${items.length} mã. Trình duyệt sẽ tải xuống ${items.length} file ảnh liên tiếp. Bạn có muốn tiếp tục?`)) return;
    }

    items.forEach((item, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${item.base64}`;
            link.download = `${item.code}.png`;
            link.click();
        }, index * 300); // Delay nhỏ để tránh trình duyệt chặn
    });
  };

  // 3. Logic PDF (Mở cửa sổ in nhưng gợi ý lưu PDF)
  // Thực tế trên web, Save as PDF là một tính năng của dialog In. 
  // Ta sẽ mở cửa sổ in với giao diện tối ưu cho trang giấy A4.
  const handlePDF = () => {
     openPrintWindow('pdf');
  };

  // Hàm mở cửa sổ phụ
  const openPrintWindow = (mode: 'print' | 'pdf' = 'print') => {
    const printContent = printRef.current?.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    if (printWindow && printContent) {
      printWindow.document.write('<html><head><title>Barcode Print</title>');
      printWindow.document.write(`
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .print-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
          }
          .barcode-item { 
            border: 1px dashed #ccc; 
            padding: 15px; 
            text-align: center; 
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .barcode-img { max-width: 100%; height: 70px; object-fit: contain; }
          .barcode-code { font-weight: bold; font-size: 16px; margin-top: 5px; }
          
          /* Nếu là PDF mode, có thể căn chỉnh A4 tốt hơn */
          @page { size: A4; margin: 1cm; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        // Không đóng ngay nếu user muốn xem preview
        // printWindow.close(); 
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[90vh] flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Xem trước bản in ({items.length} tem)
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div ref={printRef} className="print-grid grid grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.code} className="barcode-item bg-white p-4 rounded shadow-sm border flex flex-col items-center">
                <img 
                  src={`data:image/png;base64,${item.base64}`} 
                  alt={item.code} 
                  className="barcode-img mb-2"
                />
                <p className="barcode-code text-gray-800 font-mono">{item.code}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions (3 Buttons) */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
            <button 
                onClick={handleDownloadPNG}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
            >
                <Download size={18} />
                <span>Tải PNG</span>
            </button>
            
            <button 
                onClick={handlePDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
            >
                <FileText size={18} />
                <span>Lưu PDF</span>
            </button>

            <div className="h-full w-[1px] bg-gray-300 mx-2"></div>

            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
            >
                <Printer size={18} />
                <span>In Ngay</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;