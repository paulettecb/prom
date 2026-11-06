#!/usr/bin/env python3
"""Genera la invitación: una página general y una por egresado.

    python3 construir.py          # páginas
    python3 construir.py --og     # páginas + imágenes de vista previa (necesita playwright)

Para cambiar un nombre: edita datos/egresados.json y vuelve a correr el script.
"""
import html, json, os, shutil, sys

# En Netlify se toma solo de la variable URL (el dominio principal del sitio).
DOMINIO = os.environ.get("URL", "https://prom.kynstudio.com.mx").rstrip("/")
AQUI = os.path.dirname(os.path.abspath(__file__))
DESCRIPCION = "Graduación de la Licenciatura en Psicología. Viernes 27 de noviembre, 8:00 pm, Mansión Mansur."


def leer(p):
    with open(os.path.join(AQUI, p), encoding="utf-8") as f:
        return f.read()


def escribir(p, texto):
    ruta = os.path.join(AQUI, p)
    os.makedirs(os.path.dirname(ruta) or ".", exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)


def pagina(plantilla, egresados, e, R=None):
    if R is None:
        R = "../" if e else ""
    lista = "".join(f"<li>{html.escape(x['completo'])}</li>" for x in egresados)
    datos = json.dumps({"slug": e["slug"], "corto": e["corto"], "completo": e["completo"]}, ensure_ascii=False) if e else "null"
    valores = {
        "R": R,
        "SLUG": e["slug"] if e else "",
        "TITULO": f"Invitados de {e['corto']} · Graduación Psicología 2026" if e else "Graduación Psicología 2026",
        "DESCRIPCION": DESCRIPCION,
        "URL": f"{DOMINIO}/{e['slug']}/" if e else f"{DOMINIO}/",
        "OG_IMAGEN": f"{DOMINIO}/assets/og/{e['slug'] if e else 'general'}.jpg",
        "PARA": f"Invitados de {e['corto']}" if e else "Estás invitado",
        "INVITADO_A": "Estás invitado a la graduación de" if e else "Estás invitado a nuestra",
        "NOMBRE": e["completo"] if e else "Graduación",
        "LISTA": lista,
        "DATOS": datos,
    }
    out = plantilla
    for k, v in valores.items():
        seguro = v if k in ("R", "LISTA", "DATOS") else html.escape(v, quote=True)
        out = out.replace("{{" + k + "}}", seguro)
    return out


def main():
    egresados = json.loads(leer("datos/egresados.json"))
    slugs = [e["slug"] for e in egresados]
    assert len(slugs) == len(set(slugs)), "Hay dos egresados con el mismo slug"

    publicos = [{"slug": e["slug"], "corto": e["corto"], "completo": e["completo"]} for e in egresados]
    escribir("assets/js/egresados.js", "window.EGRESADOS = " + json.dumps(publicos, ensure_ascii=False, indent=1) + ";\n")

    plantilla = leer("plantilla.html")
    escribir("index.html", pagina(plantilla, egresados, None))
    # Netlify muestra 404.html cuando un link está mal escrito: que caiga en la invitación general
    escribir("404.html", pagina(plantilla, egresados, None, R="/"))
    for e in egresados:
        escribir(f"{e['slug']}/index.html", pagina(plantilla, egresados, e))

    with open(os.path.join(AQUI, "links.txt"), "w", encoding="utf-8") as f:
        for e in egresados:
            marca = "" if e.get("confirmado") else "   (apodo por confirmar)"
            f.write(f"{e['completo']}: {DOMINIO}/{e['slug']}/{marca}\n")

    if "--og" in sys.argv:
        imagenes_og(egresados)
    print(f"Listo: index.html y {len(egresados)} páginas personalizadas. Links en links.txt")


def imagenes_og(egresados):
    from playwright.sync_api import sync_playwright
    plantilla = leer("og/og.html")
    os.makedirs(os.path.join(AQUI, "assets/og"), exist_ok=True)
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": 1200, "height": 630})
        for e in [None] + egresados:
            texto = f"Invitados de {e['corto']}" if e else "Estás invitado"
            ruta = os.path.join(AQUI, "og", "_tmp.html")
            with open(ruta, "w", encoding="utf-8") as f:
                f.write(plantilla.replace("{{PARA}}", html.escape(texto)))
            pg.goto("file://" + ruta)
            pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(AQUI, "assets/og", f"{e['slug'] if e else 'general'}.jpg"), type="jpeg", quality=88)
        nav.close()
        os.remove(ruta)


if __name__ == "__main__":
    main()
