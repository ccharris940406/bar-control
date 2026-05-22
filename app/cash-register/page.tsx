import OpenCashRegisterDialog from "@/components/open-cash-register-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default async function CajaPage() {
  const today = new Date().toISOString().split("T")[0];

  const { data: register } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .single();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Caja</h1>
        {!register && <OpenCashRegisterDialog />}
      </div>

      {register ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={register.status === "open" ? "default" : "secondary"}
              >
                {register.status === "open" ? "Abierta" : "Cerrada"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">
                Saldo inicial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${register.opening_balance}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">
                Saldo final
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {register.closing_balance
                  ? `$${register.closing_balance}`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-slate-500">No hay caja abierta hoy</p>
      )}
    </div>
  );
}
