import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMasterData } from "@/hooks/useMasterData";
import { ProductTab } from "@/components/master-data/ProductTab";
import { SupplierTab } from "@/components/master-data/SupplierTab";
import { CategoryTab } from "@/components/master-data/CategoryTab";
import { ProductDialog } from "@/components/master-data/ProductDialog";
import { SupplierDialog } from "@/components/master-data/SupplierDialog";
import { CategoryDialog } from "@/components/master-data/CategoryDialog";
import { EditProductDialog } from "@/components/master-data/EditProductDialog";
import { EditSupplierDialog } from "@/components/master-data/EditSupplierDialog";
import { EditCategoryDialog } from "@/components/master-data/EditCategoryDialog";
import { ImportDialog } from "@/components/master-data/ImportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Product, Supplier, Category } from "@/types/wms";

export default function MasterDataPage() {
  const {
    activeTab,
    setActiveTab,
    products,
    suppliers,
    categories,
    isLoading,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    filteredSuppliers,
    filteredCategories,
    fetchAllData,
    handleDeleteProduct,
    handleDeleteSupplier,
    handleDeleteCategory,
  } = useMasterData();

  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Edit dialog states
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const handleEditProduct = (product: Product) => {
    setEditProduct(product);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditSupplier(supplier);
  };

  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
  };

  // const handleDeleteCategory = (id: number) => {
  //   fetchAllData(); // Refresh data after delete
  // };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Quản lý Danh mục (Master Data)"
        description="Trung tâm dữ liệu Sản phẩm, Danh mục và Nhà cung cấp - Dev 2"
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-muted">
          <TabsTrigger value="products" className="gap-2">
            Sản phẩm ({products.length})
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            Nhà cung cấp ({suppliers.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            Danh mục ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* --- COMMON FILTER BAR --- */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "products"
                  ? "Tìm SKU, Tên SP, Barcode..."
                  : activeTab === "suppliers"
                  ? "Tìm Tên, Email, SĐT NCC..."
                  : "Tìm tên danh mục..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Thêm mới
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsProductDialogOpen(true)}>
                Thêm sản phẩm
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSupplierDialogOpen(true)}>
                Thêm nhà cung cấp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCategoryDialogOpen(true)}>
                Thêm danh mục
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                Import từ Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ---------------- PRODUCT TAB CONTENT ---------------- */}
        <TabsContent value="products">
          <ProductTab
            products={filteredProducts}
            isLoading={isLoading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </TabsContent>

        {/* ---------------- SUPPLIER TAB CONTENT ---------------- */}
        <TabsContent value="suppliers">
          <SupplierTab
            suppliers={filteredSuppliers}
            products={products}
            isLoading={isLoading}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
          />
        </TabsContent>

        {/* ---------------- CATEGORY TAB CONTENT ---------------- */}
        <TabsContent value="categories">
          <CategoryTab
            categories={filteredCategories}
            products={products}
            isLoading={isLoading}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialogs */}
      <ProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        categories={categories}
        onSuccess={fetchAllData}
      />

      <SupplierDialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        onSuccess={fetchAllData}
      />

      <CategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSuccess={fetchAllData}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={fetchAllData}
      />

      {/* Edit Dialogs */}
      <EditProductDialog
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
        product={editProduct}
        categories={categories}
        onSuccess={fetchAllData}
      />

      <EditSupplierDialog
        open={!!editSupplier}
        onOpenChange={(open) => !open && setEditSupplier(null)}
        supplier={editSupplier}
        onSuccess={fetchAllData}
      />

      <EditCategoryDialog
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
        category={editCategory}
        onSuccess={fetchAllData}
      />
    </div>
  );
}
