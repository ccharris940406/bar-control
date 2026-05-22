import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewExpenseDialog from "@/components/new-expense-dialog";

const categoryColors: Record<string, string> = {
  utilities: "bg-blue-100 text-blue-800",
  cleaning: "bg-green-100 text-green-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  supplies: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

const categoryLabel: Record<string, string> = {
  utilities: "Servicios",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  supplies: "Suministros",
  other: "Otro",
};

export default async function ExpensesPage() {
  const today = new Date().toISOString().split("T")[0];

  const { data: register } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .single();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("cash_register_id", register?.id || "")
    .order("created_at", { ascending: false });
  const totalExpenses =
    expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gastos</h1>
        {register && register.status === "open" && (
          <NewExpenseDialog register={register} />
        )}
      </div>

      {!register ? (
        <p className="text-slate-500">Abre la caja para registrar gastos.</p>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">
                Total gastado hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {expenses?.length || 0} gastos
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Historial</h2>
            {!expenses?.length ? (
              <p className="text-slate-500">Sin gastos registrados.</p>
            ) : (
              expenses.map((e) => (
                <Card key={e.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{e.description}</p>
                        <div className="mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              categoryColors[e.category] || categoryColors.other
                            }`}
                          >
                            {categoryLabel[e.category] || e.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-bold">${e.amount}</p>
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
