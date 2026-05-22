"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Product = {
  id: string;
  name: string;
  stock: number;
  unit: string;
};

export default function UpdateStockDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState(product.stock.toString());
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("products")
      .update({ stock: parseInt(stock) })
      .eq("id", product.id);

    setLoading(false);
    if (!error) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Actualizar stock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Actualizar stock - {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Cantidad ({product.unit})</Label>
            <Input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
