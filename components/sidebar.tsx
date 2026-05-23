"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cash-register", label: "Caja" },
  { href: "/sales", label: "Ventas" },
  { href: "/products", label: "Productos" },
  { href: "/purchases", label: "Compras" },
  { href: "/inventory", label: "Inventario" },
  { href: "/expenses", label: "Gastos" },
  { href: "/reports", label: "Reportes" },
  { href: "/analytics", label: "Analytics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col p-4 gap-1">
      <h1 className="text-xl font-bold mb-6 px-2">Bar Control</h1>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === link.href
              ? "bg-slate-700 text-white"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          {link.label}
        </Link>
      ))}

      <div className="mt-auto pt-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
