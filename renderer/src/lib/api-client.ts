import type {
  DashboardStats,
  LedgerEntry,
  Product,
  SaleCartItem,
  SaleRecord,
  SalesReportResponse,
  StockEntry,
} from "@/lib/types";

const DEFAULT_API_URL = "http://127.0.0.1:8000/api";

declare global {
  interface Window {
    desktopConfig?: {
      apiBaseUrl?: string;
    };
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ApiError(payload?.message ?? "Request failed", response.status);
  }

  return (await response.json()) as T;
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new ApiError(payload?.message ?? "Request failed", response.status);
  }

  return (await response.json()) as T;
}

export interface ProductPayload {
  id?: number;
  name: string;
  grade: string;
  packing_size: string;
  price_per_pack: number;
  packs_per_carton: number;
  low_stock_threshold?: number;
  is_active?: boolean;
}

export interface StockEntryPayload {
  product_id: number;
  date: string;
  cartons: number;
  packs: number;
  note?: string;
}

export interface SalePayload {
  date: string;
  invoice_no?: string;
  notes?: string;
  items: Array<{
    product_id: number;
    cartons: number;
    packs: number;
  }>;
}

export const apiClient = {
  getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>("/dashboard/stats", "GET");
  },

  getProducts(): Promise<Product[]> {
    return request<Product[]>("/products", "GET");
  },

  getInventory(): Promise<Product[]> {
    return request<Product[]>("/inventory", "GET");
  },

  addProduct(payload: ProductPayload): Promise<Product> {
    return request<Product>("/products", "POST", payload);
  },

  editProduct(id: number, payload: ProductPayload): Promise<Product> {
    return request<Product>(`/products/${id}`, "PUT", payload);
  },

  deleteProduct(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/products/${id}`, "DELETE");
  },

  getStockEntries(): Promise<StockEntry[]> {
    return request<StockEntry[]>("/stock-entries", "GET");
  },

  addStockEntry(payload: StockEntryPayload): Promise<StockEntry> {
    return request<StockEntry>("/stock-entries", "POST", payload);
  },

  getSales(): Promise<SaleRecord[]> {
    return request<SaleRecord[]>("/sales", "GET");
  },

  addSale(payload: SalePayload): Promise<SaleRecord> {
    return request<SaleRecord>("/sales", "POST", payload);
  },

  getProductLedger(productId: number): Promise<LedgerEntry[]> {
    return request<LedgerEntry[]>(`/ledger/${productId}`, "GET");
  },

  getSalesReport(from?: string, to?: string): Promise<SalesReportResponse> {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    const path = query ? `/reports/sales?${query}` : "/reports/sales";
    return request<SalesReportResponse>(path, "GET");
  },

  backupDatabase(): Promise<{ success: boolean; file?: string; absolute_path?: string; message?: string }> {
    return request<{ success: boolean; file?: string; absolute_path?: string; message?: string }>(
      "/system/backup",
      "POST"
    );
  },

  restoreDatabase(file: File): Promise<{ success: boolean; message?: string }> {
    const form = new FormData();
    form.append("backup", file);
    return requestForm<{ success: boolean; message?: string }>("/system/restore", form);
  },
};

export function toSalePayload(date: string, items: SaleCartItem[], notes?: string): SalePayload {
  return {
    date,
    notes,
    items: items.map((item) => ({
      product_id: item.product_id,
      cartons: item.cartons,
      packs: item.packs,
    })),
  };
}

export { ApiError };

function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.desktopConfig?.apiBaseUrl) {
    return window.desktopConfig.apiBaseUrl.replace(/\/+$/, "");
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? DEFAULT_API_URL;
}
