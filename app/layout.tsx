import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel de proyectos web",
  description: "Proyectos, clientes, pagos, avances y mantenimiento",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <div className="content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
