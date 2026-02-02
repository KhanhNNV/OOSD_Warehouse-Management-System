import { useState, useEffect, useMemo } from "react";
import { Product, Supplier, Category } from "@/types/wms";
import { masterService } from "@/services/master.service";
import { toast } from "@/hooks/use-toast";

export function useMasterData() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [prodData, supData, catData] = await Promise.all([
        masterService.getProducts(),
        masterService.getSuppliers(),
        masterService.getCategories(),
      ]);
      setProducts(prodData);
      setSuppliers(supData);
      setCategories(catData);
    } catch (error) {
      console.error(error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu Master Data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered data with useMemo for performance
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode &&
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Delete handlers
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await masterService.deleteProduct(id);
      toast({ title: "Đã xóa sản phẩm" });
      fetchAllData();
    } catch (e) {
      toast({ title: "Lỗi xóa", variant: "destructive" });
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa nhà cung cấp này?")) return;
    try {
      await masterService.deleteSupplier(id);
      toast({ title: "Đã xóa NCC" });
      fetchAllData();
    } catch (e) {
      toast({
        title: "Không thể xóa",
        description: "NCC này có thể đã có đơn hàng.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (
      !confirm(
        "Bạn chắc chắn muốn xóa danh mục này? Tất cả sản phẩm thuộc danh mục sẽ bị ảnh hưởng."
      )
    )
      return;

    try {
      await masterService.deleteCategory(id);
      toast({ title: "Thành công", description: "Đã xóa danh mục" });
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.details || "Không thể xóa danh mục này",
        variant: "destructive",
      });
    }
  };

  return {
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
  };
}
