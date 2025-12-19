import { useState } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StocktakeSessionList } from "@/components/stocktake/StocktakeSessionList";
import { CreateStocktakeDialog } from "@/components/stocktake/CreateStocktakeDialog";
import { StocktakeSession } from "@/types/wms";

// Mock data
const mockSessions: StocktakeSession[] = [
  {
    id: "1",
    name: "Kiểm kê tuần 42 - Zone A",
    type: "zone",
    zone: "Zone A",
    status: "open",
    createdAt: "2024-10-14T08:00:00Z",
    updatedAt: "2024-10-14T10:30:00Z",
    createdBy: "Nguyễn Văn A",
    totalItems: 150,
    countedItems: 120,
    varianceCount: 8,
  },
  {
    id: "2",
    name: "Kiểm kê tuần 42 - Zone B",
    type: "zone",
    zone: "Zone B",
    status: "draft",
    createdAt: "2024-10-14T09:00:00Z",
    updatedAt: "2024-10-14T09:00:00Z",
    createdBy: "Nguyễn Văn A",
    totalItems: 200,
    countedItems: 0,
    varianceCount: 0,
  },
  {
    id: "3",
    name: "Kiểm kê hàng điện tử Q4",
    type: "category",
    category: "Điện tử",
    status: "completed",
    createdAt: "2024-10-07T08:00:00Z",
    updatedAt: "2024-10-08T16:00:00Z",
    createdBy: "Trần Thị B",
    totalItems: 89,
    countedItems: 89,
    varianceCount: 3,
  },
];

export default function StocktakePage() {
  const [sessions, setSessions] = useState<StocktakeSession[]>(mockSessions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredSessions = sessions.filter((session) =>
    session.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSession = (newSession: Omit<StocktakeSession, "id" | "createdAt" | "updatedAt" | "totalItems" | "countedItems" | "varianceCount">) => {
    const session: StocktakeSession = {
      ...newSession,
      id: String(sessions.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalItems: Math.floor(Math.random() * 200) + 50,
      countedItems: 0,
      varianceCount: 0,
    };
    setSessions([session, ...sessions]);
    setIsCreateDialogOpen(false);
  };

  const handleStatusChange = (id: string, status: StocktakeSession["status"]) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Kiểm kê"
        description="Quản lý phiên kiểm kê hàng tồn kho"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo phiên kiểm kê
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phiên kiểm kê..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Session List */}
      <StocktakeSessionList 
        sessions={filteredSessions} 
        onStatusChange={handleStatusChange}
      />

      {/* Create Dialog */}
      <CreateStocktakeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateSession}
      />
    </div>
  );
}
