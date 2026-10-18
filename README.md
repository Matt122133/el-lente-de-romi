# El Lente de Romi

Sitio propio de El Lente de Romi: portfolio y galerías de entrega para clientes.
La documentación del proyecto (decisiones, costos, arquitectura y roadmap) vive en el
[Google Doc](https://docs.google.com/document/d/1guLSpcEx4shjMr1NL4VRZF8I284Eo177pOEjgviX9E0/edit).

## Desarrollo

Requiere Node 20.9 o superior.

```sh
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

## Dónde está cada cosa

- `src/content/site.ts`: textos, categorías y datos de contacto (WhatsApp, Instagram, email).
- `src/styles/theme.css`: colores, tipografía y espaciados.
- `src/lib/placeholders.ts`: fotos de mentira con proporciones reales, para el skeleton.
- `src/components/JustifiedGrid.tsx`: la grilla justificada.
- `src/app/`: las páginas (inicio, portfolio y sus categorías, sobre mí, contacto, galería).
