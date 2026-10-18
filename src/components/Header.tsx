import Link from "next/link";
import { site } from "@/content/site";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  return (
    <header className="header">
      <div className="contenedor header-inner">
        {/* Logo pendiente: va el archivo de Romi o el que arme la diseñadora. */}
        <Link href="/" className="logo">
          {site.nombre}
        </Link>
        <nav aria-label="Principal">
          <ul className="nav">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
