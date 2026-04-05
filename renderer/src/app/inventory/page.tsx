"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { formatCartonsAndPacks } from "@/lib/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default function InventoryPage() {
  const { products, fetchProducts } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [
        product.name,
        product.grade,
        product.packing_size,
        product.current_total_packs.toString(),
        product.low_stock_threshold.toString(),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Live stock in packs and carton+pack format. Formula: total packs = cartons x packs per carton + loose packs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search inventory by product, grade, packing..."
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Packing</TableHead>
                <TableHead className="text-right">Packs/Carton</TableHead>
                <TableHead className="text-right">Cartons + Packs</TableHead>
                <TableHead className="text-right">Total Packs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {products.length === 0 ? "No inventory records." : "No matching inventory records."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.grade}</TableCell>
                    <TableCell>{product.packing_size}</TableCell>
                    <TableCell className="text-right">{product.packs_per_carton}</TableCell>
                    <TableCell className="text-right">
                      {formatCartonsAndPacks(product.current_total_packs, product.packs_per_carton)}
                    </TableCell>
                    <TableCell className="text-right">{product.current_total_packs}</TableCell>
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
