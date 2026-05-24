import OpenCashRegisterDialog from "@/components/open-cash-register-dialog";
import CloseCashRegisterDialog from "@/components/close-cash-register-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayMexico } from "@/lib/date";
import { supabase } from "@/lib/supabase";

export default async function CajaPage() {
  const today = getTodayMexico();

  const { data: register } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .eq("status", "open")
    .single();

  const { data: allRegisters } = await supabase
    .from("cash_registers")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Caja</h1>
        {(!register || register.status === "closed") && (
          <OpenCashRegisterDialog />
        )}
        {register && register.status === "open" && (
          <CloseCashRegisterDialog register={register} />
        )}
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

      {allRegisters && allRegisters.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Historial de cajas recientes</h2>
          <div className="space-y-3">
            {allRegisters.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {r.status === "open" ? "Caja abierta" : "Caja cerrada"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Abierta: {new Date(r.opened_at).toLocaleString("es-ES")}
                      </p>
                      {r.closed_at && (
                        <p className="text-sm text-slate-500">
                          Cerrada: {new Date(r.closed_at).toLocaleString("es-ES")}
                        </p>
                      )}
                      <p className="text-sm">
                        Inicial: ${r.opening_balance.toFixed(2)}
                        {r.closing_balance && (
                          <>
                            {" • Final: "}
                            ${r.closing_balance.toFixed(2)}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={r.status === "open" ? "default" : "secondary"}
                    >
                      {r.status === "open" ? "Abierta" : "Cerrada"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
