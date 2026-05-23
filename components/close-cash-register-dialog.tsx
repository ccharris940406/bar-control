"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

type CashRegister = {
  id: string;
  date: string;
  opening_balance: number;
};

export default function CloseCashRegisterDialog({
  register,
}: {
  register: CashRegister;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closingBalance, setClosingBalance] = useState("");
  const [expectedBalance, setExpectedBalance] = useState<number | null>(null);
  const [difference, setDifference] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadCalculations();
    }
  }, [open]);

  async function loadCalculations() {
    const [{ data: sales }, { data: expenses }] = await Promise.all([
      supabase
        .from("sales")
        .select("total")
        .eq("cash_register_id", register.id),
      supabase
        .from("expenses")
        .select("amount")
        .eq("cash_register_id", register.id),
    ]);

    const totalSales = sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
    const expected = register.opening_balance + totalSales - totalExpenses;
    setExpectedBalance(expected);
  }

  useEffect(() => {
    if (closingBalance && expectedBalance !== null) {
      const diff = parseFloat(closingBalance) - expectedBalance;
      setDifference(diff);
    }
  }, [closingBalance, expectedBalance]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!closingBalance) return;

    setLoading(true);

    const { error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        closing_balance: parseFloat(closingBalance),
        closed_at: new Date().toISOString(),
      })
      .eq("id", register.id);

    setLoading(false);
    if (!error) {
      setOpen(false);
      setClosingBalance("");
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg">
          Cerrar caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>
            Registra el saldo final y cierra la caja del día
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Saldo inicial:</span>
                  <span className="font-semibold">${register.opening_balance.toFixed(2)}</span>
                </div>
                {expectedBalance !== null && (
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Saldo esperado:</span>
                    <span>${expectedBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="mb-1 block">Saldo final (contado físicamente)</Label>
            <Input
              type="number"
              step="0.01"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {difference !== null && (
            <Card
              className={
                difference === 0
                  ? "bg-green-50 border-green-200"
                  : difference > 0
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
              }
            >
              <CardContent className="pt-6">
                <div className="text-sm font-semibold">
                  {difference === 0 ? (
                    <p className="text-green-700">✓ Cuadra perfectamente</p>
                  ) : difference > 0 ? (
                    <p className="text-yellow-700">
                      ⚠ Sobrante: ${difference.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-red-700">
                      ⚠ Faltante: ${Math.abs(difference).toFixed(2)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Cerrando..." : "Cerrar caja"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
