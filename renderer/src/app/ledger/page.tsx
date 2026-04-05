"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { formatCartonsAndPacks } from "@/lib/inventory";
import type { LedgerEntry } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";

export default function LedgerPage() {
  const { products, fetchProducts } = useStore();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleProductChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedProductId(value);

    if (!value) {
      setLedger([]);
      return;
    }

    const entries = await apiClient.getProductLedger(Number.parseInt(value, 10));
    setLedger(entries);
  };

  const selectedProduct = products.find((product) => product.id === Number.parseInt(selectedProductId, 10));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Ledger</h2>
        <p className="text-muted-foreground">Complete stock-in and sales history by product.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Select Product</CardTitle>
          {selectedProduct && (
            <div className="text-sm font-medium text-muted-foreground">
              Current Stock{" "}
              <span className="text-foreground ml-1 font-bold">
                {formatCartonsAndPacks(selectedProduct.current_total_packs, selectedProduct.packs_per_carton)}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <select
            className="flex h-10 w-full md:w-1/2 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedProductId}
            onChange={(event) => void handleProductChange(event)}
          >
            <option value="">Choose product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.grade} ({product.packing_size})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedProductId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead className="text-right text-green-600">Qty In</TableHead>
                  <TableHead className="text-right text-destructive">Qty Out</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found for this product.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.transaction_type === "STOCK_IN"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {entry.transaction_type === "STOCK_IN" ? (
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 mr-1" />
                          )}
                          {entry.transaction_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.reference_type ?? "-"} #{entry.reference_id ?? "-"}
                      </TableCell>
                      <TableCell className="text-right text-green-600">{entry.qty_in || "-"}</TableCell>
                      <TableCell className="text-right text-destructive">{entry.qty_out || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCartonsAndPacks(entry.balance, selectedProduct?.packs_per_carton ?? 1)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
