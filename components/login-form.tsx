"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // Obtener rol para redirigir al lugar correcto
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role ?? "mesera";

    router.push(role === "admin" || role === "encargado" ? "/" : "/mesera");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🍺</h1>
          <h2 className="text-2xl font-bold text-white">Bar Control</h2>
          <p className="text-slate-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-2xl p-6 space-y-4 shadow-xl"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/30 rounded-lg py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 text-black font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Iniciando sesión..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
