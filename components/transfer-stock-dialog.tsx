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
  warehouse_stock: number;
  display_stock: number;
  units_per_box: number;
  unit: string;
};

export default function TransferStockDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes] = useState("1");
  const router = useRouter();

  const units = parseInt(boxes) * product.units_per_box;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const boxesToTransfer = parseInt(boxes);
    if (boxesToTransfer <= 0 || boxesToTransfer > product.warehouse_stock)
      return;

    setLoading(true);

    const newWarehouseStock = product.warehouse_stock - boxesToTransfer;
    const newDisplayStock = product.display_stock + units;

    const { error: updateError } = await supabase
      .from("products")
      .update({
        warehouse_stock: newWarehouseStock,
        display_stock: newDisplayStock,
      })
      .eq("id", product.id);

    if (!updateError) {
      await supabase.from("inventory_movements").insert({
        product_id: product.id,
        from_location: "warehouse",
        to_location: "display",
        quantity: units,
        notes: `${boxesToTransfer} caja(s)`,
      });
    }

    setLoading(false);
    if (!updateError) {
      setOpen(false);
      setBoxes("1");
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Transferir</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir al enfriador - {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Cajas a transferir</Label>
            <Input
              type="number"
              min="1"
              max={product.warehouse_stock}
              value={boxes}
              onChange={(e) => setBoxes(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Disponibles: {product.warehouse_stock} cajas
            </p>
          </div>

          <div className="bg-slate-100 p-3 rounded">
            <p className="text-sm">
              Se transferirán{" "}
              <strong>
                {units} {product.unit}s
              </strong>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Enfriador: {product.display_stock} + {units} ={" "}
              {product.display_stock + units}
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Transfiriendo..." : "Transferir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
