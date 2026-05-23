import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { headers } from "next/headers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bar Control",
  description: "Sistema de contabilidad para bar",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isMesera = pathname.startsWith("/mesera");
  const isPublic = pathname.startsWith("/login");

  return (
    <html lang="es">
      <body className={geist.className}>
        {isPublic || isMesera ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 bg-slate-50">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
