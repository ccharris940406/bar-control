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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  price: number;
  display_stock: number;
};

type CartItem = Product & {
  quantity: number;
  subtotal: number;
};

type CashRegister = {
  id: string;
  date: string;
  opening_balance: number;
  status: string;
};

export default function CreateSaleDialog({
  register,
}: {
  register: CashRegister;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const router = useRouter();

  async function loadProducts() {
    setLoadingProducts(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, display_stock")
      .eq("active", true)
      .gt("display_stock", 0);
    setProducts(data || []);
    setLoadingProducts(false);
  }

  function addToCart() {
    if (!selectedProduct || !quantity) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    const subtotal = product.price * qty;

    const existingItem = cart.find((item) => item.id === selectedProduct);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === selectedProduct
            ? {
                ...item,
                quantity: item.quantity + qty,
                subtotal: (item.quantity + qty) * item.price,
              }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: qty, subtotal }]);
    }

    setSelectedProduct("");
    setQuantity("1");
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.id !== productId));
  }

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        cash_register_id: register.id,
        total,
        payment_method: paymentMethod,
      })
      .select()
      .single();

    if (!saleError && sale) {
      const items = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.subtotal,
      }));

      await supabase.from("sale_items").insert(items);

      // Update display_stock for each product
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          await supabase
            .from("products")
            .update({
              display_stock: product.display_stock - item.quantity,
            })
            .eq("id", item.id);
        }
      }
    }

    setLoading(false);
    if (!saleError) {
      setCart([]);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={loadProducts}>+ Nueva venta</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva venta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="mb-1 block">Producto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} (${p.price}) - Stock: {p.display_stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="mb-1 block">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addToCart}
                disabled={!selectedProduct || !quantity}
                className="w-full"
              >
                Agregar
              </Button>
            </div>
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
                      {item.quantity} x ${item.price.toFixed(2)} = $
                      {item.subtotal.toFixed(2)}
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

              <div>
                <Label className="mb-1 block">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Guardando..." : "Registrar venta"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
