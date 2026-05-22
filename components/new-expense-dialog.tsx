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
  DialogDescription,
} from "@/components/ui/dialog";

type CashRegister = {
  id: string;
  date: string;
  opening_balance: number;
  status: string;
};

export default function NewExpenseDialog({
  register,
}: {
  register: CashRegister;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "other",
  });
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    setLoading(true);

    const { error } = await supabase.from("expenses").insert({
      cash_register_id: register.id,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
    });

    setLoading(false);
    if (!error) {
      setOpen(false);
      setForm({ description: "", amount: "", category: "other" });
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nuevo gasto</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
          <DialogDescription>Registra un gasto operativo</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ej: Servicios, Limpieza"
              required
            />
          </div>

          <div>
            <Label className="mb-1 block">Monto</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label className="mb-1 block">Categoría</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilities">Servicios</SelectItem>
                <SelectItem value="cleaning">Limpieza</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="supplies">Suministros</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Registrar gasto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
