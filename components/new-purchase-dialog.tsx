"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; units_per_box: number };
type CartItem = Product & {
  quantity: number;
  price_per_box: number;
  units_per_box: number;
  subtotal: number;
};

export default function NewPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    price_per_box: "",
    units_per_box: "1",
  });
  const router = useRouter();

  async function loadData() {
    setLoadingData(true);
    const [suppliersRes, productsRes] = await Promise.all([
      supabase.from("suppliers").select("id, name").order("name"),
      supabase
        .from("products")
        .select("id, name, units_per_box")
        .eq("active", true)
        .neq("requires_inventory", false)
        .order("name"),
    ]);
    setSuppliers(suppliersRes.data || []);
    setProducts(productsRes.data || []);
    setLoadingData(false);
  }

  function addToCart() {
    if (!form.product_id || !form.quantity || !form.price_per_box) return;

    const product = products.find((p) => p.id === form.product_id);
    if (!product) return;

    const quantity = parseInt(form.quantity);
    const pricePerBox = parseFloat(form.price_per_box);
    const unitsPerBox = parseInt(form.units_per_box) || 1;
    const subtotal = quantity * pricePerBox;

    const existingItem = cart.find((item) => item.id === form.product_id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === form.product_id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price_per_box,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        { ...product, quantity, price_per_box: pricePerBox, units_per_box: unitsPerBox, subtotal },
      ]);
    }

    setForm({ product_id: "", quantity: "", price_per_box: "", units_per_box: "1" });
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.id !== productId));
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!selectedSupplier || cart.length === 0) return;

    setLoading(true);

    // Registrar compra
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        supplier_id: selectedSupplier,
        total,
      })
      .select()
      .single();

    if (!purchaseError && purchase) {
      // Insertar items
      const items = cart.map((item) => ({
        purchase_id: purchase.id,
        product_id: item.id,
        quantity: item.quantity,
        price_per_box: item.price_per_box,
        units_per_box: item.units_per_box,
        subtotal: item.subtotal,
      }));

      await supabase.from("purchase_items").insert(items);

      // Actualizar warehouse_stock y cost para cada producto
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const currentProduct = await supabase
            .from("products")
            .select("warehouse_stock")
            .eq("id", item.id)
            .single();

          const totalUnits = item.quantity * item.units_per_box;
          await supabase
            .from("products")
            .update({
              warehouse_stock:
                (currentProduct.data?.warehouse_stock || 0) + totalUnits,
              cost: item.price_per_box,
            })
            .eq("id", item.id);
        }
      }
    }

    setLoading(false);
    if (!purchaseError) {
      setOpen(false);
      setSelectedSupplier("");
      setCart([]);
      setForm({ product_id: "", quantity: "", price_per_box: "", units_per_box: "1" });
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          onClick={() => {
            setOpen(true);
            loadData();
          }}
        >
          + Nueva compra
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar compra</DialogTitle>
          <DialogDescription>
            Registra una nueva compra de productos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Proveedor</Label>
            <Select
              value={selectedSupplier}
              onValueChange={setSelectedSupplier}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="mb-1 block">Producto</Label>
            <Select
              value={form.product_id}
              onValueChange={(v) => {
                const product = products.find((p) => p.id === v);
                setForm({
                  ...form,
                  product_id: v,
                  units_per_box: product?.units_per_box.toString() || "1",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="mb-1 block text-sm">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Por presentación</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.units_per_box}
                  onChange={(e) =>
                    setForm({ ...form, units_per_box: e.target.value })
                  }
                  className="text-sm"
                  placeholder="24"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm">Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_per_box}
                  onChange={(e) =>
                    setForm({ ...form, price_per_box: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addToCart}
              className="w-full text-sm"
            >
              Agregar
            </Button>
          </div>

          {cart.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Carrito</h3>
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-slate-100 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × {item.units_per_box} unidades @ ${item.price_per_box.toFixed(2)} = ${item.subtotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Total: {item.quantity * item.units_per_box} unidades
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Registrar compra"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
