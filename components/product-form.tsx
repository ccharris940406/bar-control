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
import NewCategoryDialog from "./new-category-dialog";

type Category = { id: string; name: string; type: string };

export default function ProductForm({
  categories: initialCategories,
  onSuccess,
}: {
  categories: Category[];
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    price: "",
    stock: "",
    min_stock: "",
    unit: "unit",
    units_per_box: "1",
    requires_inventory: false,
  });

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("products").insert({
      name: form.name,
      category_id: form.category_id,
      price: parseFloat(form.price),
      cost: 0,
      warehouse_stock: form.stock ? parseInt(form.stock) : 0,
      display_stock: 0,
      units_per_box: parseInt(form.units_per_box) || 1,
      min_stock: form.min_stock ? parseInt(form.min_stock) : 0,
      unit: form.unit,
      requires_inventory: form.requires_inventory,
    });

    setLoading(false);
    if (!error) onSuccess();
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
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1 block">Categoría</Label>
            <Select
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
          <NewCategoryDialog
            onCategoryCreated={(newCat) => {
              setCategories([...categories, newCat]);
              setForm({ ...form, category_id: newCat.id });
            }}
          />
        </div>
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
          <Label className="mb-1 block">Stock inicial (opcional)</Label>
          <Input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            placeholder="Registra compras después"
          />
          <p className="text-xs text-slate-400 mt-1">Usa el módulo Compras</p>
        </div>
        <div>
          <Label className="mb-1 block">Stock mínimo (opcional)</Label>
          <Input
            type="number"
            min="0"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <Label className="mb-1 block">Unidad</Label>
          <Input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="mb-1 block">Por caja</Label>
          <Input
            type="number"
            min="1"
            value={form.units_per_box}
            onChange={(e) => setForm({ ...form, units_per_box: e.target.value })}
            placeholder="1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requires_inventory"
          checked={form.requires_inventory}
          onChange={(e) => setForm({ ...form, requires_inventory: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="requires_inventory" className="mb-0">
          Requiere inventario (cajas, bebidas, etc.)
        </Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando..." : "Agregar producto"}
      </Button>
    </form>
  );
}
