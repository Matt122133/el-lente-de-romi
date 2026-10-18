import { site, whatsappUrl } from "@/content/site";

export function Footer() {
  const { instagram, email } = site.contacto;
  const wa = whatsappUrl();
  return (
    <footer className="footer">
      <div className="contenedor footer-inner">
        <span>
          © {new Date().getFullYear()} {site.nombre}
        </span>
        <ul className="redes">
          <li>{wa ? <a href={wa}>WhatsApp</a> : <span>WhatsApp</span>}</li>
          <li>
            {instagram ? (
              <a href={`https://instagram.com/${instagram}`}>Instagram</a>
            ) : (
              <span>Instagram</span>
            )}
          </li>
          <li>{email ? <a href={`mailto:${email}`}>Email</a> : <span>Email</span>}</li>
        </ul>
      </div>
    </footer>
  );
}
