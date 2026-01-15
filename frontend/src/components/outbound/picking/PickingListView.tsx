import React from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PickingTask } from "@/types/outboundDetails";

interface Props {
    orderId: string | undefined;
    tasks: PickingTask[];
    onBack: () => void;
    onSelectTask: (taskId: number) => void;
    onSubmit: () => void;
}

export const PickingListView: React.FC<Props> = ({ orderId, tasks, onBack, onSelectTask, onSubmit }) => {
    const completedCount = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'FLAGGED').length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white p-4 border-b shrink-0 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
                    <h1 className="font-bold text-xl">Đơn #{orderId}</h1>
                </div>
                <Badge variant={progress === 100 ? "default" : "secondary"}>
                    {completedCount}/{tasks.length}
                </Badge>
            </div>

            {/* List */}
            <div className="flex-0 overflow-y-auto p-3 space-y-3">
                {tasks.map(t => (
                    <Card 
                        key={t.id} 
                        onClick={() => onSelectTask(t.id)} 
                        className={`active:scale-[0.98] transition-transform border-l-4 ${
                            t.status === 'COMPLETED' ? 'border-l-green-500 bg-green-50/50' 
                            : t.status === 'FLAGGED' ? 'border-l-red-500 bg-red-50/50' 
                            : 'border-l-orange-500'
                        }`}
                    >
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg">{t.locationCode || "---"}</div>
                                <div className="text-sm text-slate-600">{t.productName}</div>
                            </div>
                            <div className="text-right">
                                {t.status === 'COMPLETED' ? (
                                    <CheckCircle2 className="text-green-600 w-8 h-8" />
                                ) : t.status === 'FLAGGED' ? (
                                    <Badge variant="destructive">Lỗi</Badge>
                                ) : (
                                    <span className="text-xl font-bold">x{t.requestedQty}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Footer Button (Chỉ hiện khi làm xong hết) */}
            <div className="p-4 bg-white border-t shrink-0">
                <Button 
                    className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700" 
                    disabled={progress < 100} 
                    onClick={onSubmit}
                >
                    HOÀN THÀNH & GỬI
                </Button>
            </div>
        </div>
    );
};