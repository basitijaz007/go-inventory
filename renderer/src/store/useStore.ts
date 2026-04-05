import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { DashboardStats, Product, SaleCartItem } from "@/lib/types";

interface AppState {
  products: Product[];
  dashboardStats: DashboardStats;
  cart: SaleCartItem[];
  loading: boolean;

  setProducts: (products: Product[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  addToCart: (item: SaleCartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  fetchProducts: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
}

const defaultStats: DashboardStats = {
  todaySales: 0,
  allProducts: 0,
  lowStockProducts: 0,
};

export const useStore = create<AppState>((set) => ({
  products: [],
  dashboardStats: defaultStats,
  cart: [],
  loading: false,

  setProducts: (products) => set({ products }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) =>
    set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [] }),

  fetchProducts: async () => {
    const products = await apiClient.getInventory();
    set({ products });
  },

  fetchDashboardStats: async () => {
    const stats = await apiClient.getDashboardStats();
    set({ dashboardStats: stats });
  },

  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const [products, dashboardStats] = await Promise.all([
        apiClient.getInventory(),
        apiClient.getDashboardStats(),
      ]);
      set({ products, dashboardStats });
    } finally {
      set({ loading: false });
    }
  },
}));
