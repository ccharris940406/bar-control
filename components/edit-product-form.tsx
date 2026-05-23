"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type Category = { id: string; name: string; type: string };

type Product = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  display_stock: number;
  warehouse_stock: number;
  min_stock: number;
  unit: string;
  units_per_box: number;
  requires_inventory: boolean;
};

export default function EditProductForm({
  product,
  categories,
  onSuccess,
}: {
  product: Product;
  categories: Category[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    category_id: product.category_id,
    price: product.price.toString(),
    display_stock: product.display_stock.toString(),
    warehouse_stock: product.warehouse_stock.toString(),
    min_stock: product.min_stock.toString(),
    unit: product.unit,
    units_per_box: product.units_per_box.toString(),
    requires_inventory: product.requires_inventory,
  });

  async function handleDelete() {
    if (!confirm(`¿Seguro que quieres eliminar "${product.name}"? No aparecerá más en el catálogo.`)) return;
    setLoading(true);
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", product.id);
    setLoading(false);
    if (!error) onSuccess();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const price = parseFloat(form.price);
      const displayStock = parseInt(form.display_stock) || 0;
      const warehouseStock = parseInt(form.warehouse_stock) || 0;
      const minStock = parseInt(form.min_stock) || 0;

      if (!form.name || !form.category_id || !form.unit || isNaN(price)) {
        alert("Por favor completa todos los campos requeridos");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          category_id: form.category_id,
          price,
          display_stock: displayStock,
          warehouse_stock: warehouseStock,
          min_stock: minStock,
          unit: form.unit,
          units_per_box: parseInt(form.units_per_box) || 1,
          requires_inventory: form.requires_inventory,
        })
        .eq("id", product.id);

      if (error) {
        console.error("Error al actualizar:", error);
        alert(`Error: ${error.message}`);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-1 block">Nombre</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label className="mb-1 block">Categoría</Label>
        <Select
          value={form.category_id}
          onValueChange={(v) => setForm({ ...form, category_id: v })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1 block">Precio de venta</Label>
          <Input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label className="mb-1 block">Almacén (cajas)</Label>
          <Input
            type="number"
            min="0"
            value={form.warehouse_stock}
            onChange={(e) =>
              setForm({ ...form, warehouse_stock: e.target.value })
            }
          />
        </div>
        <div>
          <Label className="mb-1 block">Enfriador (unidades)</Label>
          <Input
            type="number"
            value={form.display_stock}
            onChange={(e) => setForm({ ...form, display_stock: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1 block">Por caja</Label>
          <Input
            type="number"
            min="1"
            value={form.units_per_box}
            onChange={(e) => setForm({ ...form, units_per_box: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1 block">Stock mínimo</Label>
          <Input
            type="number"
            min="0"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label className="mb-1 block">Unidad</Label>
        <Input
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requires_inventory"
          checked={form.requires_inventory}
          onChange={(e) =>
            setForm({ ...form, requires_inventory: e.target.checked })
          }
          className="w-4 h-4"
        />
        <Label htmlFor="requires_inventory" className="mb-0">
          Requiere inventario (cajas, bebidas, etc.)
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={loading}
          onClick={handleDelete}
        >
          Eliminar
        </Button>
      </div>
    </form>
  );
}
