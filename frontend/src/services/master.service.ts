import api from "@/services/api";
import { Product, Supplier, Category, CategoryRequest } from "@/types/wms";

export interface CreateProductData {
  sku: string;
  name: string;
  barcode?: string;
  categoryId: string;
  unit: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export const masterService = {
  // --- CATEGORIES ---
  getCategories: async () => {
    const res = await api.get<Category[]>("/api/categories");
    return res.data;
  },

  createCategory: async (data: CategoryRequest) => {
    const res = await api.post("/api/categories", data);
    console.log("data:", data);
    return res.data;
  },

  updateCategory: async (id: number, data: CategoryRequest) => {
    const res = await api.put(`/api/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id: number) => {
    await api.delete(`/api/categories/${id}`);
  },

  // --- SUPPLIERS ---
  getSuppliers: async () => {
    const res = await api.get<Supplier[]>("/api/suppliers");
    return res.data;
  },

  createSupplier: async (data: Omit<Supplier, "id">) => {
    const res = await api.post("/api/suppliers", data);
    return res.data;
  },

  updateSupplier: async (id: number, data: Partial<Supplier>) => {
    const res = await api.put(`/api/suppliers/${id}`, data);
    return res.data;
  },

  deleteSupplier: async (id: number) => {
    await api.delete(`/api/suppliers/${id}`);
  },

  // --- PRODUCTS ---
  getProducts: async () => {
    const res = await api.get<Product[]>("/api/products");
    return res.data;
  },

  getProductById: async (id: number) => {
    const res = await api.get<Product>(`/api/products/${id}`);
    return res.data;
  },

  // createProduct: async (formData: FormData) => {
  //   const res = await api.post("/api/products", formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   });
  //   return res.data;
  // },
  // updateProduct: async (id: number, formData: FormData) => {
  //   const res = await api.put(`/api/products/${id}`, formData, {
  //     headers: { "Content-Type": "multipart/form-data" },
  //   });
  //   return res.data;
  // },

  createProduct: async (formData: FormData) => {
    const res = await api.post("/api/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // updateProduct: async (id: number, formData: FormData) => {
  //   const res = await api.put(`/api/products/${id}`, formData, {
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //   });
  //   return res.data;
  // },
  // deleteProduct: async (id: number) => {
  //   await api.delete(`/api/products/${id}`);
  // },

  updateProduct: async (id: number, formData: FormData) => {
    console.log(`🔄 Updating product ${id} with:`, {
      id,
      formData: {
        sku: formData.get("sku"),
        name: formData.get("name"),
        categoryId: formData.get("categoryId"),
        imageUrl: formData.get("imageUrl"),
        hasImageFile: formData.get("image") ? "Yes" : "No",
      },
    });

    try {
      const res = await api.put(`/api/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(`✅ Product ${id} updated successfully:`, res.data);
      return res.data;
    } catch (error: any) {
      console.error(`❌ Error updating product ${id}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  importProducts: async (formData: FormData) => {
    const res = await api.post("/api/products/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteProduct: async (id: number) => {
    await api.delete(`/api/products/${id}`);
  },

  // --- UTILS ---
  formatCurrency: (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  },
};
