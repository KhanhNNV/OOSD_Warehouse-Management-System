import React from "react";
import { Invoice } from '../../types/invoice';

// Helper format tiền tệ
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

interface Props {
    data: Invoice | null;
}

// Dùng React.forwardRef để thư viện in ấn có thể "chụp" được component này
export const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
    if (!data) return null;

    return (
        <div ref={ref} className="p-10 text-black bg-white" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", fontSize: "13px", fontFamily: "Times New Roman, serif" }}>

            {/* --- HEADER --- */}
            <div className="flex justify-between mb-6">
                <div>
                    <p className="font-bold">Đơn vị: ........................</p>
                    <p>Bộ phận: ........................</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">Mẫu số 02 - VT</p>
                    <p className="italic text-xs">(Ban hành theo Thông tư số 200/2014/TT-BTC</p>
                    <p className="italic text-xs">ngày 22/12/2014 của Bộ Tài chính)</p>
                </div>
            </div>

            {/* --- TITLE --- */}
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase">PHIẾU XUẤT KHO</h1>
                <p className="italic">Ngày {new Date(data.createdAt).getDate()} tháng {new Date(data.createdAt).getMonth() + 1} năm {new Date(data.createdAt).getFullYear()}</p>
                <p className="font-bold">Số: {data.invoiceNumber}</p>
            </div>

            {/* --- INFO KHÁCH HÀNG --- */}
            <div className="mb-6 space-y-1">
                <p>- Họ và tên người nhận hàng: <span className="font-bold">{data.customer?.name}</span></p>
                <p>- Địa chỉ (bộ phận): {data.customer?.address}</p>
                <p>- Lý do xuất kho: Xuất bán hàng theo đơn {data.outboundNote?.outboundOrder?.orderNumber}</p>
                <p>- Xuất tại kho (ngăn lô): ....................................................</p>
            </div>

            {/* --- TABLE SẢN PHẨM --- */}
            <table className="w-full border-collapse border border-black mb-4 text-sm">
                <thead>
                <tr className="bg-gray-100 text-center font-bold">
                    <th className="border border-black p-1 w-10">STT</th>
                    <th className="border border-black p-1">Tên nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ sản phẩm, hàng hóa</th>
                    <th className="border border-black p-1 w-20">Mã số</th>
                    <th className="border border-black p-1 w-16">ĐVT</th>
                    <th className="border border-black p-1 w-16">Số lượng</th>
                    <th className="border border-black p-1 w-24">Đơn giá</th>
                    <th className="border border-black p-1 w-28">Thành tiền</th>
                </tr>
                {/* Đánh số cột A B C D... như mẫu */}
                <tr className="text-center italic text-xs">
                    <td className="border border-black">A</td>
                    <td className="border border-black">B</td>
                    <td className="border border-black">C</td>
                    <td className="border border-black">D</td>
                    <td className="border border-black">1</td>
                    <td className="border border-black">2</td>
                    <td className="border border-black">3</td>
                </tr>
                </thead>
                <tbody>
                {data.details?.map((item, index) => (
                    <tr key={index}>
                        <td className="border border-black p-1 text-center">{index + 1}</td>
                        <td className="border border-black p-1">{item.product.name}</td>
                        <td className="border border-black p-1 text-center">{item.product.sku}</td>
                        <td className="border border-black p-1 text-center">{item.product.unit}</td>
                        <td className="border border-black p-1 text-center font-bold">{item.quantity}</td>
                        <td className="border border-black p-1 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-black p-1 text-right font-bold">{formatCurrency(item.totalLineAmount)}</td>
                    </tr>
                ))}

                {/* Dòng tổng cộng */}
                <tr className="font-bold">
                    <td className="border border-black p-1 text-center" colSpan={4}>Cộng tiền hàng</td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-right">{formatCurrency(data.totalAmount)}</td>
                </tr>
                <tr className="font-bold">
                    <td className="border border-black p-1 text-center" colSpan={4}>Thuế GTGT (8%)</td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-right">{formatCurrency(data.taxAmount)}</td>
                </tr>
                <tr className="font-bold text-lg">
                    <td className="border border-black p-1 text-center" colSpan={4}>Tổng thanh toán</td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-right">{formatCurrency(data.finalAmount)}</td>
                </tr>
                </tbody>
            </table>

            {/* --- FOOTER TIỀN BẰNG CHỮ --- */}
            <div className="mb-6">
                <p>- Tổng số tiền (viết bằng chữ): ....................................................................................................</p>
                <p>- Số chứng từ gốc kèm theo: ..............................................................................................................</p>
            </div>

            {/* --- CHỮ KÝ --- */}
            <div className="flex justify-between text-center mt-8">
                <div className="w-1/4">
                    <p className="font-bold">Người lập phiếu</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                    <p className="font-bold">{data.createdBy?.fullName}</p>
                </div>
                <div className="w-1/4">
                    <p className="font-bold">Người nhận hàng</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                    <p className="font-bold">{data.customer?.name}</p>
                </div>
                <div className="w-1/4">
                    <p className="font-bold">Thủ kho</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
                <div className="w-1/4">
                    <p className="font-bold">Kế toán trưởng</p>
                    <p className="italic text-xs">(Ký, họ tên)</p>
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
});