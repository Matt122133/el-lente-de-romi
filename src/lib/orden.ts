// Orden natural de nombres de archivo: 2 antes que 10 (FR-015 de la 002). Lo usan el script
// de fotos y el panel, así una galería queda en el mismo orden la suba quien la suba. Sin
// imports: lo carga Node sin bundler.

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

export function ordenNatural(a: string, b: string): number {
  return collator.compare(a, b);
}
