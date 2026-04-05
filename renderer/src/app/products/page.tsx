"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, type ProductPayload } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackagePlus, Edit2, Trash2 } from "lucide-react";

const emptyForm: ProductPayload = {
  name: "",
  grade: "",
  packing_size: "",
  price_per_pack: 0,
  packs_per_carton: 12,
  low_stock_threshold: 10,
};

export default function ProductsPage() {
  const { products, fetchProducts } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductPayload>(emptyForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const isEditing = useMemo(() => editingProductId !== null, [editingProductId]);

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
        product.price_per_pack.toString(),
        product.packs_per_carton.toString(),
        product.low_stock_threshold.toString(),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, searchTerm]);

  const resetForm = () => {
    setEditingProductId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isEditing && editingProductId) {
        await apiClient.editProduct(editingProductId, formData);
        alert("Saved successfully.");
      } else {
        await apiClient.addProduct(formData);
        alert("Saved successfully.");
      }

      await fetchProducts();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      grade: product.grade,
      packing_size: product.packing_size,
      price_per_pack: product.price_per_pack,
      packs_per_carton: product.packs_per_carton,
      low_stock_threshold: product.low_stock_threshold,
      is_active: product.is_active,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product? This works only if there is no history linked.")) {
      return;
    }

    try {
      await apiClient.deleteProduct(id);
      await fetchProducts();
      alert("Deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground">
          Each packing size is treated as a separate product variant.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Product" : "Add Product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="GO Flash 4T"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade</label>
                <Input
                  required
                  value={formData.grade}
                  onChange={(event) => setFormData({ ...formData, grade: event.target.value })}
                  placeholder="20W40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Packing Size</label>
                <Input
                  required
                  value={formData.packing_size}
                  onChange={(event) => setFormData({ ...formData, packing_size: event.target.value })}
                  placeholder="0.7 Liter"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price per Pack</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price_per_pack}
                  onChange={(event) =>
                    setFormData({ ...formData, price_per_pack: Number.parseFloat(event.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Packs per Carton</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.packs_per_carton}
                  onChange={(event) =>
                    setFormData({ ...formData, packs_per_carton: Number.parseInt(event.target.value, 10) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Threshold (packs)</label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.low_stock_threshold}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      low_stock_threshold: Number.parseInt(event.target.value, 10) || 0,
                    })
                  }
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                <PackagePlus className="w-4 h-4 mr-2" />
                {isEditing ? "Update Product" : "Save Product"}
              </Button>

              {isEditing && (
                <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products by name, grade, packing..."
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Packing</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Packs/Carton</TableHead>
                  <TableHead className="text-right">Low Stock</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {products.length === 0 ? "No products available." : "No matching products."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.grade}</TableCell>
                      <TableCell>{product.packing_size}</TableCell>
                      <TableCell className="text-right">Rs {product.price_per_pack.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.packs_per_carton}</TableCell>
                      <TableCell className="text-right">{product.low_stock_threshold}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Edit2 className="w-4 h-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => void handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
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
