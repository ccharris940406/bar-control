import CreateSaleDialog from "@/components/create-sale-dialog";
import PrintTicketButton from "@/components/print-ticket-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default async function SalesPage() {
  const today = new Date().toISOString().split("T")[0];

  // Buscar si hay caja abierta para mostrar botón
  const { data: openRegister } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .eq("status", "open")
    .single();

  // Obtener TODAS las cajas del día ordenadas de más reciente a más antigua
  const { data: allRegisters } = await supabase
    .from("cash_registers")
    .select("id, opened_at, status")
    .eq("date", today)
    .order("opened_at", { ascending: false });

  const registerIds = allRegisters?.map((r) => r.id) || [];

  // Obtener todas las ventas de TODAS las cajas del día
  const { data: sales } = await supabase
    .from("sales")
    .select("*, sale_items(*, products(name))")
    .in("cash_register_id", registerIds.length > 0 ? registerIds : [""])
    .order("created_at", { ascending: false });

  const totalSales =
    sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;

  // Agrupar ventas por caja (ya vienen ordenadas de más reciente a más antigua)
  const salesByRegister = allRegisters?.reduce((acc: any, register: any) => {
    const registerSales = sales?.filter(
      (sale: any) => sale.cash_register_id === register.id
    ) || [];
    const registerTotal = registerSales.reduce(
      (sum: number, sale: any) => sum + parseFloat(sale.total),
      0
    );
    if (registerSales.length > 0) {
      acc.push({
        registerId: register.id,
        openedAt: register.opened_at,
        status: register.status,
        sales: registerSales,
        total: registerTotal,
      });
    }
    return acc;
  }, []) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas</h1>
        {openRegister && (
          <CreateSaleDialog register={openRegister} />
        )}
      </div>

      {!allRegisters || allRegisters.length === 0 ? (
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
                  {sales?.length || 0} transacciones • {allRegisters?.length || 0} caja(s)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {!sales?.length ? (
              <p className="text-slate-500">Sin ventas registradas.</p>
            ) : (
              salesByRegister.map((registerData: any, idx: number) => (
                <div key={registerData.registerId} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">
                      Caja {salesByRegister.length - idx}
                    </h2>
                    <span className="text-sm text-slate-500">
                      Abierta: {new Date(registerData.openedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Badge variant={registerData.status === "open" ? "default" : "secondary"}>
                      {registerData.status === "open" ? "Abierta" : "Cerrada"}
                    </Badge>
                  </div>
                  {registerData.sales.map((sale: any) => (
                <Card key={sale.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">${sale.total}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(sale.created_at).toLocaleTimeString("es-ES")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {sale.payment_method === "cash"
                            ? "Efectivo"
                            : sale.payment_method === "card"
                              ? "Tarjeta"
                              : "Transferencia"}
                        </Badge>
                        <PrintTicketButton sale={sale} />
                      </div>
                    </div>

                    {sale.sale_items && sale.sale_items.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded space-y-2">
                        <p className="text-xs font-semibold text-slate-600">
                          Detalles:
                        </p>
                        <div className="space-y-1 text-sm">
                          {sale.sale_items.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                {item.products?.name} × {item.quantity}
                              </span>
                              <span className="font-medium">
                                ${item.subtotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                          <span>Total:</span>
                          <span>${sale.total}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                  ))
                  }
                  <Card className="bg-slate-100 border-slate-300">
                    <CardContent className="pt-6">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Subtotal Caja {idx + 1}:</span>
                        <span>${registerData.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
