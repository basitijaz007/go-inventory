"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { totalPacks } from "@/lib/inventory";
import type { StockEntry } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownToLine } from "lucide-react";

export default function StockEntryPage() {
  const { products, fetchProducts } = useStore();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    product_id: "",
    cartons: 0,
    packs: 0,
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number.parseInt(formData.product_id, 10)),
    [formData.product_id, products]
  );

  const calculatedTotal = selectedProduct
    ? totalPacks(formData.cartons, selectedProduct.packs_per_carton, formData.packs)
    : 0;

  const packsPerCartonByProductId = useMemo(
    () => new Map(products.map((product) => [product.id, product.packs_per_carton])),
    [products]
  );

  const filteredStockEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return stockEntries;
    }

    return stockEntries.filter((entry) =>
      [
        entry.date,
        entry.product_name,
        entry.product_grade,
        entry.product_packing_size,
        entry.note ?? "",
        entry.cartons.toString(),
        entry.packs.toString(),
        entry.total_packs.toString(),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchTerm, stockEntries]);

  const loadEntries = async () => {
    const entries = await apiClient.getStockEntries();
    setStockEntries(entries);
  };

  useEffect(() => {
    void (async () => {
      await Promise.all([fetchProducts(), loadEntries()]);
    })();
  }, [fetchProducts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) {
      alert("Select product");
      return;
    }

    if (calculatedTotal <= 0) {
      alert("Total packs must be greater than zero");
      return;
    }

    setLoading(true);
    try {
      await apiClient.addStockEntry({
        product_id: selectedProduct.id,
        cartons: formData.cartons,
        packs: formData.packs,
        date: formData.date,
        note: formData.note || undefined,
      });

      await Promise.all([fetchProducts(), loadEntries()]);
      setFormData({
        ...formData,
        product_id: "",
        cartons: 0,
        packs: 0,
        note: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save stock entry";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Entry</h2>
        <p className="text-muted-foreground">Record incoming cartons and loose packs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add Incoming Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  required
                  value={formData.product_id}
                  onChange={(event) => setFormData({ ...formData, product_id: event.target.value })}
                >
                  <option value="" disabled>
                    Select product
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.grade} ({product.packing_size}) - {product.packs_per_carton} packs/carton
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cartons</label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={formData.cartons}
                    onChange={(event) =>
                      setFormData({ ...formData, cartons: Number.parseInt(event.target.value, 10) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Packs</label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={formData.packs}
                    onChange={(event) =>
                      setFormData({ ...formData, packs: Number.parseInt(event.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Input
                  value={formData.note}
                  onChange={(event) => setFormData({ ...formData, note: event.target.value })}
                  placeholder="Supplier invoice / remarks"
                />
              </div>

              {selectedProduct && (
                <div className="bg-muted text-muted-foreground text-sm p-3 rounded-md flex justify-between">
                  <span>
                    1 carton = {selectedProduct.packs_per_carton} packs
                    <br />
                    Formula: {formData.cartons} x {selectedProduct.packs_per_carton} + {formData.packs}
                    <br />
                    Total Packs
                  </span>
                  <span className="font-bold text-foreground self-end">{calculatedTotal}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full mt-2">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Save Stock In
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search stock entries by product, date, note..."
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Cartons</TableHead>
                  <TableHead className="text-right">Packs</TableHead>
                  <TableHead className="text-right">Formula</TableHead>
                  <TableHead className="text-right">Total Packs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStockEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {stockEntries.length === 0 ? "No stock entries found." : "No matching stock entries."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStockEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                      <TableCell className="font-medium">
                        {entry.product_name} ({entry.product_packing_size})
                      </TableCell>
                      <TableCell className="text-right">{entry.cartons}</TableCell>
                      <TableCell className="text-right">{entry.packs}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {packsPerCartonByProductId.has(entry.product_id)
                          ? `${entry.cartons} x ${packsPerCartonByProductId.get(entry.product_id)} + ${entry.packs}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">{entry.total_packs}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
