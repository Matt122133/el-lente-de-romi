import { whatsappUrl } from "@/content/site";

export function BotonWhatsapp({ texto = "Escribime por WhatsApp" }: { texto?: string }) {
  const url = whatsappUrl();
  if (!url) {
    return (
      <span className="boton boton-deshabilitado" title="Falta cargar el número">
        {texto}
      </span>
    );
  }
  return (
    <a className="boton" href={url} target="_blank" rel="noopener noreferrer">
      {texto}
    </a>
  );
}
