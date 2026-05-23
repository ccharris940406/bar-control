"use client";

import { useState } from "react";
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

type Category = { id: string; name: string; type: string };

export default function NewCategoryDialog({
  onCategoryCreated,
}: {
  onCategoryCreated: (category: Category) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("drink");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, type })
      .select()
      .single();

    setLoading(false);
    if (!error && data) {
      onCategoryCreated(data);
      setOpen(false);
      setName("");
      setType("drink");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          + Nueva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bebidas Preparadas"
              required
            />
          </div>

          <div>
            <Label className="mb-1 block">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drink">Bebida</SelectItem>
                <SelectItem value="food">Comida</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creando..." : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
