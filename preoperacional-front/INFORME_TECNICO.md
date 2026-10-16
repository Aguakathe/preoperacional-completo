# Informe técnico – NCR Atleos (front-end)

## 1. Resumen

SPA en **Angular 22** conectada a un back-end Java (Jakarta EE + JPA + MySQL). Login con sesión del
servidor (cookie HttpOnly, contraseñas BCrypt), formulario preoperacional, historial, fotos de estado por
categoría, gastos de mantenimiento con documentos y administración de usuarios.

Antes todo vivía en el navegador (`localStorage` e IndexedDB, contraseñas en texto plano). Eso ya no
existe: el navegador no guarda nada y la seguridad la decide el servidor.

## 2. Flujo de información

```
 /inicio            Portada
 /inicio/login      LoginComponent ── AuthService.login() ── POST /api/login ──► cookie de sesión
        │
 /dashboard?seccion=…   (authGuard)
        ├─ preoperacional  → PreoperacionalService.enviar()  → POST /api/preoperacionales
        ├─ historial       → listar / detalle / eliminar     → GET/DELETE /api/preoperacionales
        ├─ mantenimientos
        │    ├─ fotos      → FotosService.guardarInspeccion() → POST /api/mantenimientos (multipart)
        │    ├─ galería    → fotos(), mantenimientos()        → GET/PUT/DELETE /api/fotos, /api/mantenimientos
        │    └─ gastos     → GastosService.crear()            → POST /api/gastos (multipart con documentos)
        ├─ usuarios (admin)→ UsuariosService                  → GET/POST/PUT /api/usuarios
        └─ mi cuenta       → AuthService.cambiarPassword()     → PUT /api/password
 Salir → POST /api/logout → /inicio/login
```

- **Arranque**: `provideAppInitializer` llama a `GET /api/login`. Responde el usuario (200) o nada (204).
  Por eso los guards pueden decidir al instante y recargar la página no cierra la sesión.
- **Sesión vencida**: el interceptor detecta `401` en rutas protegidas → limpia la sesión → login con aviso.
- **Datos por usuario**: `FotosService` y `GastosService` se recargan al iniciar sesión y se vacían al
  cerrarla (un `effect` sobre `AuthService.usuario`), así un usuario nunca ve datos del anterior.

## 3. Decisiones de diseño

| Decisión | Por qué |
|---|---|
| Componentes *standalone* (migración oficial de Angular) | Con Angular 22 las pruebas no compilaban: los componentes vivían en un `NgModule` que las pruebas no cargaban (28 errores). Standalone es además el estándar actual. |
| Servicios con `async/await` que devuelven `{ ok, error }` | Los componentes muestran el mensaje exacto del servidor (`{"error": "..."}`) sin manejar observables. |
| Estado con *signals* | La galería, los contadores y los totales se actualizan solos al cambiar los datos. |
| Pestañas del panel conservadas (ocultas, no destruidas) | Lo escrito en el preoperacional (≈40 respuestas) no se pierde por mirar otra sección. |
| Pestaña activa en la URL (`?seccion=`) | Recargar o compartir el enlace abre la misma sección. |
| Catálogos en `models/` | Las preguntas y elementos del preoperacional, categorías de foto, tipos de gasto y formas de pago están en un solo lugar y coinciden con los que valida el back-end. |
| Piezas compartidas (`shared/`) | Encabezado de página, zona de carga, medidor de contraseña y campo de placa estaban copiados en 2–3 componentes. |

## 4. Diseño visual

Un solo sistema de diseño en `src/styles.css` (tokens de color, botones, formularios, tarjetas) más piezas
comunes: etiquetas de estado (`.badge`), chip de placa (`.chip-placa`), tarjetas de resumen (`.stats`),
listas de registros (`.registro`), estados vacío / cargando / error y diálogo modal. Todas las secciones usan
el mismo encabezado (`app-page-header`). Avisos abajo a la izquierda en escritorio (no tapan el botón principal
de la barra de acciones ni las pestañas) y arriba en móvil.

## 5. Accesibilidad
- Pestañas con roles ARIA y navegación con flechas / Inicio / Fin.
- Radios con `name` real en el HTML (también los de nombre dinámico) → se agrupan y se navegan con flechas.
- `id` únicos en toda la página (antes «Fotos de estado» repetía los del preoperacional, que sigue montado).
- Diálogos con foco atrapado, cierre con Esc y devolución del foco; avisos con `role=status/alert`.

## 6. Pruebas
`npm run test:ci` → **102 pruebas** (Vitest + jsdom) en 23 archivos: servicios contra un servidor simulado
(`HttpTestingController`), interceptor, guards, directiva de placa y todos los componentes.
Utilidades comunes en `src/testing/ayudas.ts`.

## 7. Dependencias
Angular 22.2 · TypeScript 6 · RxJS 7.8 · zone.js 0.15 · Vitest 5 + jsdom. Sin librerías de UI externas.
Requisito: **Node 22.22.3+ o 24** (`.nvmrc` = 24).
