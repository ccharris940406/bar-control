import CreateSaleDialog from "@/components/create-sale-dialog";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default async function SalesPage() {
  const today = new Date().toISOString().split("T")[0];

  const [{ data: register }, { data: sales }] = await Promise.all([
    supabase.from("cash_registers").select("*").eq("date", today).single(),
    supabase
      .from("sales")
      .select("*, cash_registers(date)")
      .eq("cash_registers.date", today)
      .order("created_at", { ascending: false }),
  ]);

  const totalSales =
    sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas</h1>
        {register && register.status === "open" && (
          <CreateSaleDialog register={register} />
        )}
      </div>

      {!register ? (
        <p className="text-slate-500">Abre la caja para registrar ventas.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-500">
                  Total hoy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${totalSales.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {sales?.length || 0} transacciones
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Historial</h2>
            {!sales?.length ? (
              <p className="text-slate-500">Sin ventas registradas.</p>
            ) : (
              sales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">${sale.total}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(sale.created_at).toLocaleTimeString(
                            "es-ES",
                          )}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {sale.payment_method === "cash"
                          ? "Efectivo"
                          : "Tarjeta"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
