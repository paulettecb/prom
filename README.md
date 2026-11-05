# Graduación Psicología 2026

Invitación web a la fiesta de graduación de la Licenciatura en Psicología, UVM. Viernes 27 de noviembre de 2026, Mansión Mansur, Zapopan.

Sitio estático, sin build en Netlify. Cada egresado tiene su propio link y su propia vista previa para WhatsApp.

## Cómo funciona

- `/` es la invitación general. El sobre dice «Estás invitado».
- `/sara/`, `/denny/`, `/paulette/`… son las invitaciones de cada egresado. El sobre dice «Invitados de Sara» y adentro «Estás invitado a la graduación de Ana Sarahí Ruiz Myers».
- `links.txt` tiene la lista de links para repartir.
- Un link mal escrito manda a la invitación general.

## Cambiar algo

1. Nombres y apodos: `datos/egresados.json` (`corto` es lo que va en el sobre, `completo` lo de adentro, `slug` el link).
2. Textos y secciones: `plantilla.html`. Estilos: `assets/css/estilos.css`.
3. Correr `python3 construir.py` para regenerar las páginas. Con `--og` también regenera las imágenes de vista previa (necesita `pip install playwright`).
4. Commit y push. Netlify publica solo.

Si el subdominio no es `prom.kynstudio.com.mx`, cambia `DOMINIO` arriba de `construir.py` y vuelve a correrlo: las vistas previas de WhatsApp necesitan la dirección completa.

## Netlify

- Nuevo sitio desde el repo, sin comando de build, carpeta de publicación `.` (ya viene en `netlify.toml`).
- Dominio: agregar el subdominio en Domain management. Si el DNS de kynstudio.com.mx no está en Netlify, crear un registro CNAME `prom` apuntando a `<sitio>.netlify.app`.

## Diseño

Sale del design system «Graduación Psicología»: hueso, noche y ciruela, oro en línea, Lamoric Rowen, NoirEtBlanc, Mallcity y Blastine. Las fuentes son de uso personal.
