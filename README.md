# Joceconc - Google Sheet CMS

Este proyecto lee canciones desde Google Sheets para que cualquier persona actualice lanzamientos sin tocar codigo.

Los links de redes sociales ya son fijos en `src/App.jsx`.

## 1) Configuracion local

1. Copiar `.env.example` a `.env`.
2. Completar `VITE_GOOGLE_SHEET_ID` con el ID de tu hoja.
3. Dejar este nombre de pestana (o cambiarlo):
   - `VITE_GOOGLE_SHEET_SONGS_TAB=canciones`

El ID de la hoja es el texto entre `/d/` y `/edit` en la URL.

## 2) Preparar Google Sheet

Crear una pestana llamada `canciones`.

Encabezados recomendados (el proyecto acepta ambos):

- Formato simple: `Youtube | Nombre de la cancion | link_de_la_cancion`
- Formato extendido: `plataforma | album | nombre | link`

Filas de ejemplo:

- `Youtube | Mandinga Abrime la Puerta | https://www.youtube.com/watch?v=toIvq65LjsA`
- `Youtube | Otro lanzamiento | https://youtu.be/abc123xyz`
- `spotify | Melodias de una Noche de Verano | Yo siempre estare aqui | https://open.spotify.com/track/...`

La primera fila de canciones queda destacada en el reproductor.

## 3) Permisos de la hoja

Para que la web pueda leerla:

1. Abrir la hoja.
2. Click en `Compartir`.
3. Cambiar acceso general a `Cualquier persona con el enlace`.
4. Rol: `Lector`.

## 4) Como funciona la actualizacion

- La web consulta Google Sheet al cargar.
- Luego vuelve a consultar cada 60 segundos.
- Cuando tu amigo edita/agrega filas, la pagina se actualiza sola.

## 5) Desarrollo

- `npm install`
- `npm run dev`
- `npm run build`
