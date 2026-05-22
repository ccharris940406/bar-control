import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewPurchaseDialog from "@/components/new-purchase-dialog";

export default async function PurchasesPage() {
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*, suppliers(name), purchase_items(*, products(name))")
    .order("created_at", { ascending: false })
    .limit(50);

  const totalSpent =
    purchases?.reduce((sum, p) => sum + parseFloat(p.total), 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compras</h1>
        <NewPurchaseDialog />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">
            Total gastado (últimas 50 compras)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial</h2>
        {!purchases?.length ? (
          <p className="text-slate-500">Sin compras registradas.</p>
        ) : (
          purchases.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.suppliers?.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(p.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <p className="text-lg font-bold">${p.total}</p>
                  </div>
                  <div className="space-y-2 bg-slate-50 p-3 rounded">
                    {p.purchase_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products?.name}</span>
                        <span className="text-slate-600">
                          {item.quantity} x ${item.price_per_box} = ${item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
