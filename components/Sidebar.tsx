"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Resumen", icon: "home" },
  { href: "/proyectos", label: "Proyectos", icon: "folder" },
  { href: "/clientes", label: "Clientes", icon: "users" },
  { href: "/mantenimiento", label: "Mantenimiento", icon: "wrench" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">P</span>
        <span className="brand-text">
          Panel<small>Proyectos web</small>
        </span>
      </Link>

      <nav className="side-nav">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
            <Icon name={l.icon} />
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>

      <div className="side-foot">
        <Link href="/proyectos/nuevo" className="btn primary block">
          <Icon name="plus" size={16} /> Nuevo proyecto
        </Link>
      </div>
    </aside>
  );
}
