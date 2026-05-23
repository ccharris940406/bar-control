import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TransferStockDialog from "@/components/transfer-stock-dialog";

export default async function InventoryPage() {
  const { data: allProducts } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("active", true)
    .order("name");

  const products = allProducts?.filter((p) => p.requires_inventory !== false) || [];
  const lowDisplayStock = products?.filter((p) => p.display_stock <= 5) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventario</h1>

      {lowDisplayStock.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">
              Enfriador con stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-orange-800">
            {lowDisplayStock.length} producto(s) necesita(n) reabastecimiento
            del almacén
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!products?.length ? (
          <p className="text-slate-500">No hay productos.</p>
        ) : (
          products.map((p) => (
            <Card
              key={p.id}
              className={p.display_stock <= 5 ? "border-orange-300" : ""}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.categories?.name}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Almacén (cajas)
                        </p>
                        <p className="font-semibold">{p.warehouse_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Enfriador (unidades)
                        </p>
                        <p className="font-semibold">
                          {p.display_stock} {p.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Por caja</p>
                        <p className="font-semibold">{p.units_per_box}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {p.display_stock <= 5 && (
                      <Badge variant="destructive">Bajo</Badge>
                    )}
                    {p.warehouse_stock > 0 && (
                      <TransferStockDialog product={p} />
                    )}
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
