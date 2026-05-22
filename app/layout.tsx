import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bar Control",
  description: "Sistema de contabilidad para bar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={geist.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 bg-slate-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
