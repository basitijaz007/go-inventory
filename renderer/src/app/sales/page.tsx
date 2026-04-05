"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, toSalePayload } from "@/lib/api-client";
import { formatCartonsAndPacks, totalPacks } from "@/lib/inventory";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Plus, ShoppingCart, Trash2 } from "lucide-react";

export default function SalesPage() {
  const { products, cart, addToCart, removeFromCart, clearCart, fetchProducts, fetchDashboardStats } = useStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    cartons: 0,
    packs: 0,
    notes: "",
  });

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number.parseInt(form.product_id, 10)),
    [form.product_id, products]
  );

  const requestedTotalPacks = selectedProduct
    ? totalPacks(form.cartons, selectedProduct.packs_per_carton, form.packs)
    : 0;

  const currentInCart = selectedProduct
    ? cart
        .filter((item) => item.product_id === selectedProduct.id)
        .reduce((sum, item) => sum + item.total_packs, 0)
    : 0;

  const availablePacks = selectedProduct?.current_total_packs ?? 0;
  const wouldBeRemaining = availablePacks - currentInCart - requestedTotalPacks;

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleAddToCart = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct) {
      alert("Select a product.");
      return;
    }

    if (requestedTotalPacks <= 0) {
      alert("Enter quantity greater than zero.");
      return;
    }

    if (requestedTotalPacks + currentInCart > availablePacks) {
      alert(
        `Insufficient stock. Available ${availablePacks} packs, in cart ${currentInCart} packs, requested ${requestedTotalPacks} packs.`
      );
      return;
    }

    addToCart({
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      grade: selectedProduct.grade,
      packing_size: selectedProduct.packing_size,
      cartons: form.cartons,
      packs: form.packs,
      total_packs: requestedTotalPacks,
      price_per_pack: selectedProduct.price_per_pack,
      subtotal: requestedTotalPacks * selectedProduct.price_per_pack,
    });

    setForm({
      ...form,
      product_id: "",
      cartons: 0,
      packs: 0,
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const date = new Date().toISOString().split("T")[0];
      await apiClient.addSale(toSalePayload(date, cart, form.notes || undefined));
      clearCart();
      setForm({ product_id: "", cartons: 0, packs: 0, notes: "" });
      await Promise.all([fetchProducts(), fetchDashboardStats()]);
      alert("Sale recorded successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save sale";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sales (POS)</h2>
        <p className="text-muted-foreground">Record cartons and packs sold. Negative stock is blocked.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 h-fit">
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddToCart} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  required
                  value={form.product_id}
                  onChange={(event) => setForm({ ...form, product_id: event.target.value })}
                >
                  <option value="" disabled>
                    Select product
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.packing_size}) - {product.packs_per_carton} packs/carton - Rs {product.price_per_pack}
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
                    value={form.cartons}
                    onChange={(event) =>
                      setForm({ ...form, cartons: Number.parseInt(event.target.value, 10) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Packs</label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={form.packs}
                    onChange={(event) => setForm({ ...form, packs: Number.parseInt(event.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="text-sm rounded-md bg-muted p-3 space-y-1">
                  <p>1 carton = {selectedProduct.packs_per_carton} packs</p>
                  <p>Requested: {requestedTotalPacks} packs</p>
                  <p>Available: {availablePacks} packs</p>
                  <p className={wouldBeRemaining < 0 ? "text-destructive font-semibold" : ""}>
                    Remaining after add: {wouldBeRemaining} packs
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-8 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 border-b pb-4">
              <ShoppingCart className="w-5 h-5" />
              Current Cart
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Cart is empty
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item, index) => (
                    <TableRow key={`${item.product_id}-${index}`}>
                      <TableCell className="font-medium">
                        {item.name} ({item.packing_size})
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCartonsAndPacks(item.total_packs, products.find((p) => p.id === item.product_id)?.packs_per_carton ?? 1)}
                      </TableCell>
                      <TableCell className="text-right">Rs {item.price_per_pack.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">Rs {item.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Notes (optional)</label>
              <Input
                className="w-[280px]"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Invoice note"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-primary">Rs {cartTotal.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCart} disabled={cart.length === 0 || loading}>
                  Clear Cart
                </Button>
                <Button size="lg" onClick={handleCheckout} disabled={cart.length === 0 || loading}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
