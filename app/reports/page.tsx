import { getTodayMexico } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
  const today = getTodayMexico();

  // Obtener TODAS las cajas del día
  const { data: allRegisters } = await supabase
    .from("cash_registers")
    .select("id")
    .eq("date", today);

  const registerIds = allRegisters?.map((r) => r.id) || [];

  const [{ data: sales }, { data: expenses }, { data: saleItems }] =
    await Promise.all([
      supabase
        .from("sales")
        .select("total")
        .in("cash_register_id", registerIds.length > 0 ? registerIds : [""]),
      supabase
        .from("expenses")
        .select("amount")
        .in("cash_register_id", registerIds.length > 0 ? registerIds : [""]),
      supabase
        .from("sale_items")
        .select("*, sales(id, cash_register_id), products(name, cost, units_per_box)")
        .in("sales.cash_register_id", registerIds.length > 0 ? registerIds : [""]),
    ]);

  const totalSales =
    sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;
  const totalExpenses =
    expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const totalCOGS =
    saleItems?.reduce(
      (sum, item) =>
        sum +
        (item.quantity * (item.products?.cost || 0)) /
          (item.products?.units_per_box || 1),
      0,
    ) || 0;
  const netProfit = totalSales - totalExpenses - totalCOGS;

  const topProducts =
    saleItems
      ?.reduce((acc: any[], item: any) => {
        const existing = acc.find((p) => p.id === item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          acc.push({
            id: item.product_id,
            name: item.products?.name,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
        return acc;
      }, [])
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reportes - {today}</h1>

      {!allRegisters || allRegisters.length === 0 ? (
        <p className="text-slate-500">Abre la caja para ver reportes.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${totalSales.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">
                  Costo de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">
                  ${totalCOGS.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">
                  Ganancia Neta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-3xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${netProfit.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {!topProducts.length ? (
                <p className="text-slate-500">Sin ventas registradas.</p>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between pb-4 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-slate-500">
                          {p.quantity} unidades vendidas
                        </p>
                      </div>
                      <p className="text-lg font-bold">
                        ${p.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
