import React from 'react';
import { SupplierInvoiceResponse } from '../../types/supplierInvoice';

interface Props {
    invoice: SupplierInvoiceResponse | null;
}

export const SupplierInvoicePrintTemplate = React.forwardRef<HTMLDivElement, Props>(({ invoice }, ref) => {
    if (!invoice) return null;

    const day = new Date(invoice.createdAt).getDate();
    const month = new Date(invoice.createdAt).getMonth() + 1;
    const year = new Date(invoice.createdAt).getFullYear();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Style chuẩn cho văn bản in ấn (Times New Roman)
    const pageStyle = {
        fontFamily: '"Times New Roman", Times, serif', // 👈 Ép dùng font này mới đẹp
        fontSize: '11pt', // Cỡ chữ chuẩn văn bản
        lineHeight: '1.3',
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm 15mm', // Căn lề chuẩn A4
        margin: '0 auto',
        color: '#000', // Màu đen tuyệt đối
        backgroundColor: '#fff',
    };

    return (
        <div ref={ref} style={pageStyle}>

            {/* --- HEADER --- */}
            <div className="flex justify-between items-start mb-6">
                <div className="w-2/3">
                    <h3 className="font-bold text-base uppercase" style={{ fontSize: '12pt' }}>CÔNG TY TNHH WMS TECHNOLOGY</h3>
                    <p>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
                    <p>Điện thoại: (028) 3838 3838</p>
                </div>
                <div className="w-1/3 text-center">
                    <p className="font-bold" style={{ fontSize: '11pt' }}>Mẫu số 01-VT</p>
                    <p className="italic text-xs">(Ban hành theo TT 133/2016/TT-BTC)</p>
                </div>
            </div>

            {/* --- TITLE --- */}
            <div className="text-center mb-8 relative">
                <h1 className="font-bold uppercase mb-1" style={{ fontSize: '20pt', marginTop: '10px' }}>PHIẾU NHẬP KHO</h1>
                <p className="italic">Ngày {day} tháng {month} năm {year}</p>

                {/* Số phiếu nằm góc phải, canh chỉnh đẹp hơn */}
                <div className="absolute top-0 right-0 text-left text-sm">
                    <p>Số: <strong>{invoice.inboundNoteCode}</strong></p>
                    <p>(Kèm HĐ: {invoice.invoiceNumber})</p>
                </div>
            </div>

            {/* --- INFO SECTION --- */}
            <div className="mb-6 pl-4">
                <p className="mb-2">- Họ và tên người giao: <span className="font-bold ml-2">{invoice.supplierName}</span></p>
                <p className="mb-2">- Nhập tại kho: <span className="font-medium ml-2">Kho Chính (Main Warehouse)</span></p>
                <p className="mb-2">- Diễn giải: <span className="ml-2">Nhập kho hàng hóa theo đơn đặt hàng</span></p>
            </div>

            {/* --- TABLE (Đã chỉnh viền nét hơn) --- */}
            <table className="w-full border-collapse mb-6 text-sm" style={{ border: '1px solid black' }}>
                <thead>
                <tr className="font-bold text-center" style={{ backgroundColor: '#f3f4f6' }}> {/* Màu nền xám nhẹ header */}
                    <th className="border border-black p-2 w-10">STT</th>
                    <th className="border border-black p-2">Tên, nhãn hiệu, quy cách phẩm chất</th>
                    <th className="border border-black p-2 w-24">Mã số</th>
                    <th className="border border-black p-2 w-16">ĐVT</th>
                    <th className="border border-black p-2 w-16">SL</th>
                    <th className="border border-black p-2 w-28">Đơn giá</th>
                    <th className="border border-black p-2 w-32">Thành tiền</th>
                </tr>
                {/* Hàng A, B, C */}
                <tr className="text-center italic text-xs">
                    <td className="border border-black p-1">A</td>
                    <td className="border border-black p-1">B</td>
                    <td className="border border-black p-1">C</td>
                    <td className="border border-black p-1">D</td>
                    <td className="border border-black p-1">1</td>
                    <td className="border border-black p-1">2</td>
                    <td className="border border-black p-1">3</td>
                </tr>
                </thead>
                <tbody>
                {invoice.details?.map((item, index) => (
                    <tr key={item.id}>
                        <td className="border border-black p-2 text-center">{index + 1}</td>
                        <td className="border border-black p-2 font-medium">
                            {item.productName}
                            <span className="block italic text-xs mt-1 text-gray-600">{item.productSku}</span>
                        </td>
                        <td className="border border-black p-2 text-center">{item.productSku}</td>
                        <td className="border border-black p-2 text-center">Cái</td>
                        <td className="border border-black p-2 text-center font-bold">{item.quantity}</td>
                        <td className="border border-black p-2 text-right tracking-wide">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-black p-2 text-right font-bold tracking-wide">{formatCurrency(item.totalLineAmount)}</td>
                    </tr>
                ))}

                {/* TỔNG KẾT (Chỉnh font to hơn chút) */}
                <tr>
                    <td colSpan={6} className="border border-black p-2 text-right font-bold">Cộng tiền hàng:</td>
                    <td className="border border-black p-2 text-right">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
                <tr>
                    <td colSpan={6} className="border border-black p-2 text-right font-bold">Thuế GTGT (VAT):</td>
                    <td className="border border-black p-2 text-right">{formatCurrency(invoice.taxAmount)}</td>
                </tr>
                <tr>
                    <td colSpan={6} className="border border-black p-2 text-right font-bold uppercase" style={{ fontSize: '12pt' }}>Tổng thanh toán:</td>
                    <td className="border border-black p-2 text-right font-bold" style={{ fontSize: '12pt' }}>{formatCurrency(invoice.finalAmount)}</td>
                </tr>
                </tbody>
            </table>

            {/* --- TEXT SỐ TIỀN BẰNG CHỮ --- */}
            <div className="mb-8 italic">
                - Tổng số tiền viết bằng chữ: ............................................................................................................................................................
            </div>

            {/* --- SIGNATURES (Kéo dãn khoảng cách ký cho rộng) --- */}
            <div className="grid grid-cols-4 gap-2 text-center align-top">
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '10pt' }}>Người lập phiếu</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-28 mt-2"></div> {/* Khoảng trống ký tên rộng hơn */}
                    <p className="font-bold">{invoice.createdByName}</p>
                </div>
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '10pt' }}>Người giao hàng</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '10pt' }}>Thủ kho</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold uppercase" style={{ fontSize: '10pt' }}>Kế toán trưởng</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                </div>
            </div>
        </div>
    );
});