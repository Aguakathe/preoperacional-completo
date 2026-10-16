# Sistema Preoperacional de Motos – Back-end

API REST para el front Angular de **NCR Atleos – Sistema de Gestión de Motos**
(repositorio `preoperacional`, carpeta `forms-updated`).

Reemplaza el almacenamiento en el navegador (`localStorage` / IndexedDB) por una base de datos
MySQL: **usuarios y login, formulario preoperacional, inspecciones con fotos por categoría y gastos
de mantenimiento con sus documentos**.

Sigue la misma estructura del proyecto de referencia `inventario`
(Jakarta EE + Servlets + JPA/Hibernate + MySQL).

---

## 1. Tecnologías

| Capa | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Servidor | Apache Tomcat 10.1 / 11 (Jakarta EE) |
| Persistencia | MySQL 8 (o MariaDB 10.6+) + JPA / Jakarta Persistence con Hibernate 6.4 |
| API | Servlets REST (`/api/*`) que responden JSON (Jackson) |
| Archivos | `multipart/form-data` (fotos y documentos guardados como `LONGBLOB`) |
| Seguridad | Login con sesión (cookie HttpOnly), contraseñas cifradas con BCrypt, roles `admin` / `usuario` |

## 2. Arquitectura

```
src/main/java/com/mycompany/preoperacional/
├── model/entity/   Entidades JPA (mapeo de las tablas)
│     Usuario, Rol, UsuarioRol (login)
│     Preoperacional, RespuestaSalud, ElementoNoCumple
│     Mantenimiento, Foto
│     GastoMantenimiento, DocumentoGasto
├── dao/            Acceso a datos: GenericDAO<T,ID> + un DAO por entidad (consultas JPQL)
├── service/        Lógica de negocio: validaciones del formulario, permisos, archivos
├── controler/      Recursos REST (Servlets @WebServlet("/api/...")) que reciben y devuelven JSON
│                   ApiServlet = base común (lectura de JSON/multipart y códigos de error)
├── DTO/            Objetos que viajan en el JSON (no se exponen las entidades)
└── util/           JPAUtil, JsonUtil, PasswordUtil, SesionUtil, Catalogos,
                    AuthFilter (protege /api/*), CorsFilter (front Angular),
                    AppInit + DatosIniciales (roles y usuarios de prueba)
src/main/resources/META-INF/persistence.xml   Conexión a MySQL (unidad PreoperacionalPU)
src/main/webapp/WEB-INF/web.xml               Orden de los filtros: CORS → sesión
sql/preoperacional.sql                        Script de la BD (opcional)
pruebas/pruebas-api.sh                        88 pruebas automáticas de la API con curl
```

Flujo de una petición: **Angular (HttpClient) → Controller (Servlet) → Service → DAO → JPA/Hibernate → MySQL**.

## 3. Base de datos (10 tablas)

```
usuario 1──* usuario_rol *──1 rol

usuario 1──* preoperacionales 1──* preoperacional_salud      (paso 4: 7 preguntas)
                              1──* preoperacional_elementos  (paso 6: elementos que no cumplen)

usuario 1──* mantenimientos 1──* fotos                        (8 categorías)

usuario 1──* gastos_mantenimiento 1──* documentos_gasto
```

| Tabla | Columnas principales |
|---|---|
| `usuario` | id_usuario, username (único), password_hash, nombre, email, estado, fecha_creacion |
| `rol` / `usuario_rol` | ADMIN, USUARIO |
| `preoperacionales` | id_usuario, fecha_envio, conoce_campana, qlid, nombre_completo, placa_moto, kilometraje, documentacion_vigente, estado_general_vehiculo, estado_sistemas_accesorios, elementos_mal_estado, *_perfecto (4), confirmacion_insegura, confirmacion_inspeccion, **apto_para_conducir** |
| `preoperacional_salud` | orden, pregunta, respuesta (`si`/`no`) |
| `preoperacional_elementos` | categoria (`documentacion`, `estadoGeneral`, `estadoMecanico`, `estadoSistemas`), elemento |
| `mantenimientos` | placa, kilometraje, fecha_inspeccion, inspector, observaciones, id_usuario, creado_en |
| `fotos` | id_mantenimiento, nombre, tipo, tamano, categoria, creada_en, id_usuario, datos (LONGBLOB) |
| `gastos_mantenimiento` | placa, kilometraje, fecha_gasto, tipo_gasto, descripcion, proveedor, valor_gasto DECIMAL(12,2), forma_pago, numero_factura, fecha_vencimiento, kilometraje_anterior, proximo_mantenimiento, observaciones, id_usuario, fecha_creacion |
| `documentos_gasto` | id_gasto, nombre, tipo, tamano, datos (LONGBLOB) |

Los nombres de los campos JSON son **los mismos que ya usa el front** (`placaMoto`, `saludItems`,
`elementosNoCumplen`, `fotoIds`, `valorGasto`, etc.), para que conectar Angular cambie lo mínimo.

## 4. Instalación y despliegue

### Requisitos
- JDK 21
- Apache Tomcat 10.1 o 11
- MySQL 8 (o MariaDB 10.6+) en `localhost:3306`
- NetBeans (recomendado) o Maven 3.9

### Credenciales de base de datos
En `src/main/resources/META-INF/persistence.xml`:

| Propiedad | Valor |
|---|---|
| URL | `jdbc:mysql://localhost:3306/preoperacional` |
| Usuario | `root` |
| Contraseña | _(vacía)_ |

También se pueden cambiar **sin recompilar** con variables de entorno de Tomcat
(`DB_URL`, `DB_USER`, `DB_PASSWORD`), útil si cada integrante del equipo tiene otra clave.

### Pasos
1. **Base de datos** (opcional): `mysql -u root -p < sql/preoperacional.sql`.
   Si no lo ejecutas, Hibernate crea la base y las tablas al desplegar (`hbm2ddl.auto=update`).
   Ambos caminos producen exactamente el mismo esquema.
2. **Compilar**: en NetBeans *Clean and Build*, o `mvn clean package` → `target/preoperacional.war`.
3. **Desplegar**: *Run* en NetBeans, o copiar el `.war` a `webapps/` de Tomcat.
4. La API queda en **http://localhost:8080/preoperacional/api/**

### Usuarios iniciales
Se crean solos al primer arranque (los mismos del front):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `12345` | admin |
| `usuario` | `123456` | usuario |

> Cámbialos después del primer ingreso (`PUT /api/password`).

## 5. Endpoints REST (JSON)

Base: `http://localhost:8080/preoperacional/api`. Todos requieren sesión salvo `login`, `logout`
y `password`. Errores: siempre `{"error": "mensaje"}`.

Códigos: `200/201/204` éxito · `400` datos inválidos · `401` sin sesión · `403` sin permiso ·
`404` no existe · `409` conflicto · `413` archivo muy grande · `415` formato no soportado ·
`503` MySQL apagado.

### Sesión y usuarios
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | `{"username":"admin","password":"12345"}` → `{id, username, nombre, rol}` |
| GET | `/login` | Usuario de la sesión actual (200), o **204** sin cuerpo si no hay sesión (el front lo consulta al abrir la app) |
| POST | `/logout` | Cierra sesión |
| PUT | `/password` | Con sesión: `{passwordActual, passwordNueva}`. Desde el login: `{username, passwordActual, passwordNueva}` |
| GET | `/usuarios` | Listado (solo admin) |
| POST | `/usuarios` | Crear `{username, password, nombre?, email?, rol?}` (solo admin; rol por defecto `usuario`) |
| PUT | `/usuarios` | Editar `{idUsuario, nombre?, email?, rol?, estado?, password?}` (solo admin) |

### Preoperacional
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/preoperacionales` | Registrar (el mismo objeto `preoperacionalData` que arma el front) |
| GET | `/preoperacionales` | Listado (usuario: los suyos · admin: todos). Filtros: `?placa=`, `?desde=AAAA-MM-DD&hasta=` |
| GET | `/preoperacionales?id=X` | Detalle con salud, elementos y confirmaciones |
| DELETE | `/preoperacionales?id=X` | Eliminar (solo admin) |

### Inspecciones y fotos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/mantenimientos` | `multipart/form-data`: parte `datos` (JSON) + una parte `fotos` por imagen |
| GET | `/mantenimientos` · `?placa=` · `?id=X` | Listado (con `fotoIds`) · por placa · detalle con fotos |
| DELETE | `/mantenimientos?id=X` | Borra la inspección y sus fotos (admin o quien la creó) |
| GET | `/fotos` · `?categoria=motor` · `?idMantenimiento=X` | Metadatos de las fotos (con `url`) |
| GET | `/fotos?conteo=1` | `{"general":3,"motor":1,...}` (las 8 categorías) |
| PUT | `/fotos` | Mover de categoría `{idFoto, categoria}` (admin o quien la subió) |
| DELETE | `/fotos?id=X` | Eliminar (admin o quien la subió) |
| GET | `/fotos/archivo?id=X` | La imagen (sirve directo en `<img src>`). `&descargar=1` para descargar |

### Gastos de mantenimiento
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/gastos` | JSON con los campos del formulario, o `multipart` con `datos` + partes `documentos` |
| GET | `/gastos` · `?placa=` · `?id=X` | Listado (con documentos) · por placa · detalle |
| GET | `/gastos?resumen=1` | `{cantidad, total, promedio}` (admite `&placa=`) |
| DELETE | `/gastos?id=X` | Eliminar (admin o quien lo registró) |
| GET | `/gastos/documento?id=X` | El PDF/imagen adjunto. `&descargar=1` para descargar |

### Otros
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/catalogos` | Listas que valida el servidor: elementos del preoperacional, preguntas de salud, categorías de foto, tipos de gasto, formas de pago y límites de archivos |

### Ejemplos

Preoperacional (todo en orden):
```json
POST /api/preoperacionales
{
  "conoceCampana": "si",
  "qlid": "AB123456", "nombreCompleto": "Ana Gómez", "placaMoto": "ABC12G", "kilometraje": 15400,
  "documentacionVigente": "buen_estado", "estadoGeneralVehiculo": "buen_estado",
  "estadoSistemasAccesorios": "buen_estado",
  "saludItems": [ {"pregunta": "No estando bajo efecto del alcohol", "respuesta": "si"}, "… 7 en total" ],
  "elementosMalEstado": "no",
  "elementosNoCumplen": null,
  "confirmaciones": { "confirmacionInsegura": "no", "confirmacionInspeccion": "si" }
}
```
Respuesta `201` con el registro, `id`, `fechaEnvio`, `registradoPor` y `aptoParaConducir`
(`false` si alguna respuesta de salud fue `no`).

Con elementos en mal estado (`"elementosMalEstado": "si"`), cada categoría debe quedar resuelta:
```json
"elementosNoCumplen": {
  "documentacion":  { "perfectoEstado": true,  "elementos": [] },
  "estadoGeneral":  { "perfectoEstado": true,  "elementos": [] },
  "estadoMecanico": { "perfectoEstado": false, "elementos": ["Nivel aceite motor"] },
  "estadoSistemas": { "perfectoEstado": false, "elementos": ["Bocina"] }
}
```

Inspección con fotos (curl):
```bash
curl -c cj -H "Content-Type: application/json" -d '{"username":"admin","password":"12345"}' \
     http://localhost:8080/preoperacional/api/login
curl -b cj http://localhost:8080/preoperacional/api/mantenimientos \
  -F 'datos={"placa":"ABC12G","kilometraje":15400,"fechaInspeccion":"2026-10-16","inspector":"Luis","categorias":["motor","llantas"]};type=application/json' \
  -F "fotos=@motor.jpg;type=image/jpeg" -F "fotos=@llanta.jpg;type=image/jpeg"
```
`categorias` lleva la categoría de cada foto **en el mismo orden** en que se envían los archivos.

## 6. Lógica de negocio (capa Service)

El servidor aplica las **mismas reglas que el front** (no confía solo en la validación del navegador):

- **`PreoperacionalService`**: respuestas obligatorias y con valores válidos; placa `ABC12G`;
  coherencia entre el paso 3 y el 5 (si marcó «mal estado» no puede decir que todo está bien);
  en el paso 6 cada categoría con «perfecto estado» **o** elementos (que deben existir en el catálogo)
  y al menos uno reportado; en el paso 7 ambas confirmaciones. Calcula `aptoParaConducir`.
- **`MantenimientoService`**: 1 a 10 fotos JPG/PNG/WEBP de máximo 10 MB, categorías válidas,
  fecha no futura. Inspección y fotos en **una sola transacción** (o se guarda todo o nada).
- **`FotoService`**: el listado nunca carga los binarios (consulta solo metadatos);
  solo el admin o quien subió la foto puede moverla o borrarla.
- **`GastoMantenimientoService`**: catálogos de tipo de gasto y forma de pago, valor > 0 redondeado
  a 2 decimales, kilometraje anterior ≤ actual < próximo mantenimiento, documentos PDF/JPG/PNG de máximo 5 MB.
- **`UsuarioService`**: usuarios únicos sin distinguir mayúsculas, contraseña mínima de 4 caracteres,
  no se puede desactivar el propio usuario ni dejar el sistema sin un administrador activo.

## 7. Front-end

El front Angular está en `../forms-updated` y ya consume esta API (ver su README). En desarrollo,
`npm start` usa `proxy.conf.json` para reenviar `/preoperacional/api` a Tomcat: el navegador ve un solo
origen, así que no hay CORS y la cookie de sesión funciona sin configuración extra.

Si el front se sirve desde otro origen sin proxy, `CorsFilter` ya lo permite para `http://localhost:4200`
(otros orígenes: variable de entorno `CORS_ORIGINS`) y el front envía la cookie (`withCredentials`).

Las fotos y documentos devuelven una `url` relativa al contexto (`api/fotos/archivo?id=5`); el front la
convierte en `/preoperacional/api/fotos/archivo?id=5`.

## 8. Pruebas

Con la app desplegada sobre una base recién creada:
```bash
bash pruebas/pruebas-api.sh        # 88 casos: login, permisos, validaciones, fotos, gastos, CORS
```

## 9. Notas

- **Orden de arranque**: no importa. Si Tomcat arranca con MySQL apagado, la API responde `503`
  y se conecta sola en cuanto MySQL esté encendido (no hace falta reiniciar Tomcat).
- **MySQL `max_allowed_packet`**: debe ser mayor que el archivo más grande (10 MB).
  MySQL 8 trae 64 MB por defecto; MariaDB/XAMPP trae 16 MB, que también alcanza.
- **MariaDB / XAMPP**: funciona igual sin cambiar nada (probado con MariaDB 10.11). Al arrancar,
  Hibernate muestra el aviso `HHH000511 ... 5.5.0 version ... is no longer supported`: lo causa el
  driver de MySQL al conectarse a MariaDB y se puede ignorar.
- El pool de conexiones de Hibernate es el básico (como en el proyecto de referencia):
  suficiente para la práctica, no para producción.
