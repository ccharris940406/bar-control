import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rutas públicas — no requieren autenticación
  if (pathname.startsWith("/login")) {
    return NextResponse.next({ request });
  }

  // Crear cliente Supabase para el proxy (patrón oficial @supabase/ssr)
  let supabaseResponse = NextResponse.next({ request });
  supabaseResponse.headers.set("x-pathname", pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.headers.set("x-pathname", pathname);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar sesión — NO escribir lógica entre esto y getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión → redirigir al login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "mesera";

  // Mesera: solo puede acceder a /mesera
  if (role === "mesera" && !pathname.startsWith("/mesera")) {
    return NextResponse.redirect(new URL("/mesera", request.url));
  }

  // Encargado: acceso completo excepto gestión de usuarios (cuando exista /usuarios)
  if (role === "encargado" && pathname.startsWith("/usuarios")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin y encargado: acceso libre al resto del panel
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
