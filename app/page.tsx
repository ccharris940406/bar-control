import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

async function getStats() {
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: register },
    { data: sales },
    { data: expenses },
    { data: products },
  ] = await Promise.all([
    supabase.from("cash_registers").select("*").eq("date", today).single(),
    supabase.from("sales").select("total").eq("cash_register_id", "null"),
    supabase.from("expenses").select("amount"),
    supabase.from("products").select("id").eq("active", true),
  ]);

  return { register, products: products?.length ?? 0 };
}

export default async function Home() {
  const { register, products } = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Caja hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {register ? `$${register.opening_amount}` : "No abierta"}
            </p>
            <p className="text-xs text-slate-400 mtmt-1">
              Estado:{" "}
              {register?.status === "open"
                ? "Abierta"
                : register
                  ? "Cerrada"
                  : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">
              Productos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products}</p>
            <p className="text-xs text-slate-400 mt-1">En catálogo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">Ventas hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$0.00</p>
            <p className="text-xs text-slate-400 mt-1">0 transacciones</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
