export interface Product {
  id: number;
  name: string;
  grade: string;
  packing_size: string;
  price_per_pack: number;
  packs_per_carton: number;
  current_total_packs: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface StockEntry {
  id: number;
  product_id: number;
  product_name: string;
  product_grade: string;
  product_packing_size: string;
  date: string;
  cartons: number;
  packs: number;
  total_packs: number;
  note?: string | null;
}

export interface LedgerEntry {
  id: number;
  product_id: number;
  date: string;
  transaction_type: "STOCK_IN" | "SALE" | string;
  reference_type?: string | null;
  reference_id?: number | null;
  qty_in: number;
  qty_out: number;
  balance: number;
  remarks?: string | null;
}

export interface DashboardStats {
  todaySales: number;
  allProducts: number;
  lowStockProducts: number;
}

export interface SaleCartItem {
  product_id: number;
  name: string;
  grade: string;
  packing_size: string;
  cartons: number;
  packs: number;
  total_packs: number;
  price_per_pack: number;
  subtotal: number;
}

export interface SaleItemRecord {
  id: number;
  sale_id: number;
  product_id: number;
  cartons: number;
  packs: number;
  total_packs: number;
  price_per_pack: number;
  subtotal: number;
  product?: Pick<Product, "id" | "name" | "grade" | "packing_size">;
}

export interface SaleRecord {
  id: number;
  date: string;
  invoice_no?: string | null;
  total_amount: number;
  notes?: string | null;
  items: SaleItemRecord[];
}

export interface SalesReportSummary {
  from: string;
  to: string;
  total_sales_amount: number;
  total_invoices: number;
  total_items_sold_packs: number;
}

export interface SalesReportResponse {
  summary: SalesReportSummary;
  sales: SaleRecord[];
}
