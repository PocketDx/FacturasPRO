import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FacturasPRO - Sistema de Facturación",
  description: "Sistema de facturación y seguimiento de cobros para autónomos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
