import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Risk Office · Sistema SGB",
  description: "Plataforma de gestión de riesgos empresariales — Sistema de Gestión de Biblioteca (SGB)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
