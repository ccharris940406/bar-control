import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTodayMexico } from "@/lib/date";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function Home() {
  const today = getTodayMexico();

  // Caja abierta hoy
  const { data: openRegister } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .eq("status", "open")
    .single();

  // Todas las cajas de hoy para calcular ventas
  const { data: todayRegisters } = await supabase
    .from("cash_registers")
    .select("id")
    .eq("date", today);

  const registerIds = todayRegisters?.map((r) => r.id) || [];

  // Ventas de la caja abierta actual
  const { data: currentSales } = await supabase
    .from("sales")
    .select("total")
    .eq("cash_register_id", openRegister?.id || "");

  const currentTotal = currentSales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;

  // Ventas totales del día (todas las cajas)
  const { data: sales } = await supabase
    .from("sales")
    .select("total")
    .in("cash_register_id", registerIds.length > 0 ? registerIds : [""]);

  const totalSales = sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;

  // Gastos del día
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .in("cash_register_id", registerIds.length > 0 ? registerIds : [""]);

  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

  // Productos que requieren inventario
  const { data: inventoryProducts } = await supabase
    .from("products")
    .select("id, name, display_stock, warehouse_stock, min_stock, unit")
    .eq("active", true)
    .neq("requires_inventory", false);

  // Productos con stock bajo en el enfriador (display_stock <= min_stock)
  const lowDisplayStock = inventoryProducts?.filter(
    (p) => p.display_stock <= p.min_stock
  ) || [];

  // Productos que necesitan comprarse (warehouse_stock = 0 y display_stock <= min_stock)
  const needsToBuy = inventoryProducts?.filter(
    (p) => p.warehouse_stock === 0 && p.display_stock <= p.min_stock
  ) || [];

  // Total de productos activos
  const { data: allProducts } = await supabase
    .from("products")
    .select("id")
    .eq("active", true);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Métricas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link href="/cash-register">
          <Card className="hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Caja actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {openRegister ? `$${currentTotal.toFixed(2)}` : "—"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {openRegister
                  ? `Abierta · Inicial: $${parseFloat(openRegister.opening_balance).toFixed(2)}`
                  : todayRegisters && todayRegisters.length > 0
                    ? "Cerrada"
                    : "Sin caja hoy"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sales">
          <Card className="hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Ventas hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{sales?.length || 0} transacciones</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses">
          <Card className="hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Gastos hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">{expenses?.length || 0} gastos</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/products">
          <Card className="hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Productos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{allProducts?.length || 0}</p>
              <p className="text-xs text-slate-400 mt-1">En catálogo</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alertas de inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enfriador con stock bajo → ir a Inventario */}
        <Link href="/inventory">
          <Card className={`hover:shadow-sm transition-all cursor-pointer ${lowDisplayStock.length > 0 ? "border-orange-300 hover:border-orange-400" : "hover:border-slate-400"}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                🧊 Enfriador con stock bajo
                {lowDisplayStock.length > 0 && (
                  <Badge variant="destructive">{lowDisplayStock.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowDisplayStock.length === 0 ? (
                <p className="text-sm text-slate-400">✓ Todo en orden</p>
              ) : (
                <div className="space-y-2">
                  {lowDisplayStock.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span>{p.name}</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        {p.display_stock} {p.unit}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-orange-500 mt-2">→ Ir a Inventario para transferir</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Productos que necesitan comprarse → ir a Compras */}
        <Link href="/purchases">
          <Card className={`hover:shadow-sm transition-all cursor-pointer ${needsToBuy.length > 0 ? "border-red-300 hover:border-red-400" : "hover:border-slate-400"}`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                🛒 Necesitan comprarse
                {needsToBuy.length > 0 && (
                  <Badge variant="destructive">{needsToBuy.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsToBuy.length === 0 ? (
                <p className="text-sm text-slate-400">✓ Stock suficiente</p>
              ) : (
                <div className="space-y-2">
                  {needsToBuy.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span>{p.name}</span>
                      <Badge variant="destructive">
                        Stock: {p.display_stock} / Mín: {p.min_stock}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-xs text-red-500 mt-2">→ Ir a Compras para registrar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
