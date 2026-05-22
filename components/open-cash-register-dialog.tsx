'use client'

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export default function OpenCashRegisterDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("cash_registers").insert({
      date: today,
      opening_balance: parseFloat(balance),
      status: "open",
    });

    setLoading(false);
    if (!error) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Abrir caja</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block">Saldo inicial</Label>
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Abriendo..." : "Abrir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
