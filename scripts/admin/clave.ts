// npm run admin:clave — pide la contraseña del panel dos veces sin mostrarla e imprime el
// hash para ADMIN_CLAVE_HASH (research R1 de specs/004-panel-de-romi). La contraseña no se
// guarda en ningún lado.

import { stdin, stdout } from "node:process";
import { hashearClave } from "../../src/lib/claves.ts";

function preguntarOculto(pregunta: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(pregunta);
    let texto = "";
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const alTipear = (c: string) => {
      for (const ch of c) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", alTipear);
          stdout.write("\n");
          resolve(texto);
          return;
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") texto = texto.slice(0, -1);
        else texto += ch;
      }
    };
    stdin.on("data", alTipear);
  });
}

const clave = await preguntarOculto("Contraseña del panel: ");
if (clave.length < 10) {
  console.error("✗ Tiene que tener al menos 10 caracteres.");
  process.exit(1);
}
if ((await preguntarOculto("Otra vez: ")) !== clave) {
  console.error("✗ No coinciden.");
  process.exit(1);
}
const hash = hashearClave(clave);
// En Railway la variable se pega tal cual. En .env.local Next expande los "$" como variables,
// así que ahí van escapados.
console.log(`\nRailway:     ADMIN_CLAVE_HASH=${hash}`);
console.log(`.env.local:  ADMIN_CLAVE_HASH=${hash.replaceAll("$", () => "\\$")}`);
