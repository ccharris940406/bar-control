import { supabase } from "@/lib/supabase";
import MeseraInterface from "@/components/mesera-interface";

export default async function MeseraPage() {
  const today = new Date().toISOString().split("T")[0];

  const { data: openRegister } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("date", today)
    .eq("status", "open")
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, display_stock, requires_inventory, category_id")
    .eq("active", true)
    .order("name");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (!openRegister) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white px-6">
          <p className="text-7xl mb-6">🔒</p>
          <h1 className="text-3xl font-bold mb-3">Caja cerrada</h1>
          <p className="text-slate-400 text-lg">
            El administrador debe abrir la caja primero
          </p>
        </div>
      </div>
    );
  }

  return (
    <MeseraInterface
      register={openRegister}
      initialProducts={products || []}
      categories={categories || []}
    />
  );
}
