import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "@/components/product-form";
import NewProductDialog from "@/components/new-product-dialog";
import EditProductDialog from "@/components/edit-product-dialog";

const typeLabel: Record<string, string> = {
  drink: "Bebida",
  food: "Comida",
  other: "Otro",
};
export default async function ProductsPage() {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name, type)")
      .eq("active", true)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <NewProductDialog categories={categories ?? []} />
      </div>

      {!products?.length ? (
        <p className="text-slate-500">No hay productos registrados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <EditProductDialog product={p} categories={categories ?? []} />
                </div>
                {p.categories && (
                  <Badge variant="secondary">
                    {typeLabel[p.categories.type]} — {p.categories.name}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-1">
                <p>
                  Precio: <span className="font-medium">${p.price}</span>
                </p>
                <p>
                  Costo:{" "}
                  <span className="font-medium">
                    <span className="font-medium">
                      $
                      {p.units_per_box
                        ? (p.cost / p.units_per_box).toFixed(2)
                        : p.cost}
                    </span>
                  </span>
                </p>
                <p>
                  Stock:{" "}
                  <span className="font-medium">
                    {p.display_stock} {p.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
