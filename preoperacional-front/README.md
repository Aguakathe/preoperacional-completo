# NCR Atleos – Front-end

Aplicación **Angular 22** (componentes *standalone*, signals, zone.js) para el sistema de gestión de motos.
Todos los datos se guardan en el back-end (`../preoperacional-back`) a través de su API REST;
el navegador no guarda usuarios, contraseñas ni registros.

## Requisitos
- **Node.js 24** (o 22.22.3 en adelante) — Angular CLI 22 no arranca con versiones anteriores.
- El back-end corriendo en `http://localhost:8080/preoperacional` (ver su README).

## Comandos
```bash
npm install        # dependencias
npm start          # http://localhost:4200 (con proxy hacia el back-end)
npm run build      # build de producción en dist/FrontEnd
npm test           # pruebas unitarias con Vitest (modo observador)
npm run test:ci    # pruebas una sola vez (102 pruebas)
```

## Conexión con el back-end
- `proxy.conf.json` + `angular.json` (`serve.options.proxyConfig`): en desarrollo, `ng serve` reenvía
  `/preoperacional/api/*` a Tomcat. El navegador ve un solo origen: no hay CORS y la cookie de sesión funciona.
- `src/environments/environment*.ts` → `apiUrl` (`/preoperacional/api`).
- `services/sesion.interceptor.ts`: envía la cookie en cada petición y, si el servidor responde `401`
  (sesión vencida tras 30 min sin uso), vuelve al login con el aviso «Tu sesión se cerró por inactividad».
- `app.config.ts` → `provideAppInitializer`: al abrir la app se pregunta al servidor si ya hay sesión,
  así recargar la página no saca al usuario.

## Estructura
```
src/app/
├── app.config.ts · app.routes.ts · app.component.*
├── models/        Tipos y catálogos: usuario, preoperacional, foto, gasto
│                  (los catálogos son los mismos que valida el back-end en util/Catalogos.java)
├── services/      api.ts (URL base y mensajes de error) · auth · usuarios · preoperacional · fotos · gastos
│                  sesion.interceptor.ts
├── guards/        authGuard (zona privada) y guestGuard (login)
├── shared/        Piezas reutilizables:
│                  page-header (encabezado de página) · zona-carga (subir archivos) · fuerza-password
│                  placa.directive (campo de placa) · icon · feedback (avisos y confirmaciones) · utils
└── components/
    ├── inicio/      Portada y login (incluye «Cambiar contraseña» sin sesión)
    └── dashboard/   Panel con pestañas (la pestaña activa queda en la URL: ?seccion=historial)
        ├── preoperacional/   Formulario de 7 pasos + tarjeta con el resultado del envío
        ├── historial/        Lista con filtros, resumen y detalle de cada preoperacional
        ├── mantenimientos/   Fotos de estado · Galería por categoría · Gastos con documentos
        ├── usuarios/         (solo admin) crear, activar/desactivar, rol y restablecer contraseña
        └── cambiar-password/ «Mi cuenta»
src/testing/ayudas.ts   Proveedores y utilidades comunes de las pruebas (servidor simulado)
```

## Roles
| | Usuario | Admin |
|---|---|---|
| Historial | solo los suyos | todos + eliminar |
| Fotos / inspecciones / gastos | ve todo; edita y borra solo lo suyo | edita y borra todo |
| Usuarios | — | sí |

Ver [`INFORME_TECNICO.md`](INFORME_TECNICO.md) para el detalle de arquitectura y decisiones.
