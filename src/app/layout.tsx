import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Risk Office · Sistema SGB",
  description: "Plataforma de gestión de riesgos empresariales — Sistema de Gestión de Biblioteca (SGB)",
};

// Applies the saved (or system-preferred) theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('sgb-theme-v1');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
