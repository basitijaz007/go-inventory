"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { formatCartonsAndPacks } from "@/lib/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Package, IndianRupee, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { products, dashboardStats, fetchInitialData } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.current_total_packs <= product.low_stock_threshold),
    [products]
  );

  const filteredLowStockProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return lowStockProducts;
    }

    return lowStockProducts.filter((product) =>
      `${product.name} ${product.grade} ${product.packing_size}`.toLowerCase().includes(query)
    );
  }, [lowStockProducts, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Daily overview for lubricants stock and sales.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {dashboardStats.todaySales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.allProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{dashboardStats.lowStockProducts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search low stock products..."
            />
          </div>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Packing</TableHead>
                  <TableHead className="text-right">Packs/Carton</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredLowStockProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm ? "No matching low stock products." : "No low stock products."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.grade}</TableCell>
                    <TableCell>{product.packing_size}</TableCell>
                    <TableCell className="text-right">{product.packs_per_carton}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">
                      {formatCartonsAndPacks(product.current_total_packs, product.packs_per_carton)} ({product.current_total_packs} packs)
                    </TableCell>
                    <TableCell className="text-right">{product.low_stock_threshold} packs</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
