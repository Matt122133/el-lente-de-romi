import type { Metadata } from "next";

// Todo el panel, login incluido, queda fuera de los buscadores (FR-014 de la 004).
export const metadata: Metadata = {
  title: { template: "%s · Panel", default: "Panel" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
