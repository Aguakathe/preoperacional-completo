# NCR Atleos – Sistema de Gestión de Motos

Sistema web para el **preoperacional diario de las motos**, el **historial de inspecciones**, las
**fotos de estado por categoría** y los **gastos de mantenimiento**, con usuarios y roles.

```
preoperacional/
├── forms-updated/          Front-end  · Angular 22 (componentes standalone, signals)
├── preoperacional-back/    Back-end   · Java 21 + Jakarta EE (Servlets) + JPA/Hibernate + MySQL
└── CAMBIOS.md              Qué se mejoró y por qué
```

```
 Navegador ──► Angular (localhost:4200) ──proxy /preoperacional/api──► Tomcat (localhost:8080) ──► MySQL
```

## Qué hace

| Sección | Usuario (conductor) | Administrador |
|---|---|---|
| **Preoperacional** | Llena el formulario de 7 pasos; el servidor valida las reglas y calcula si es apto para conducir | Igual |
| **Historial** | Ve sus preoperacionales, con filtros y el detalle de cada uno | Ve los de todos, quién los registró, y puede eliminarlos |
| **Mantenimientos** | Registra inspecciones con fotos (8 categorías), galería y gastos con facturas | Además puede mover/borrar fotos, inspecciones y gastos de cualquiera |
| **Usuarios** | — | Crea cuentas, activa/desactiva, cambia rol y restablece contraseñas |
| **Mi cuenta** | Datos de la cuenta y cambio de contraseña | Igual |

Usuarios iniciales (se crean solos la primera vez): **`admin / 12345`** y **`usuario / 123456`**.
Cámbialos después del primer ingreso.

## Cómo ponerlo a correr (paso a paso)

### Requisitos
- **JDK 21**, **Apache Tomcat 10.1**, **MySQL 8** (o XAMPP con MariaDB) y **NetBeans** (o Maven).
- **Node.js 24** (o 22.22.3 en adelante). Compruébalo con `node --version`.

### 1. Base de datos
Enciende MySQL (en XAMPP: *Start* en MySQL). No hace falta crear nada: la base `preoperacional`
y sus tablas se crean solas. Si tu usuario `root` tiene contraseña, ponla en
`preoperacional-back/src/main/resources/META-INF/persistence.xml`.

### 2. Back-end
1. En NetBeans: *File → Open Project* → carpeta `preoperacional-back`.
2. *Tools → Servers → Add Server → Apache Tomcat* y elige la carpeta de Tomcat.
3. Clic derecho al proyecto → *Clean and Build* → *Run*.
4. En la consola debe aparecer `[Preoperacional] Base de datos lista.`
5. Prueba: http://localhost:8080/preoperacional/api/catalogos debe responder `{"error":"Debe iniciar sesión…"}`.

> El orden no importa: si Tomcat arranca con MySQL apagado, se conecta solo se enciende.

### 3. Front-end
```powershell
cd forms-updated
npm install
npm start
```
Abre **http://localhost:4200** y entra con `admin / 12345`.
`npm start` usa `proxy.conf.json` para reenviar `/preoperacional/api` a Tomcat (sin problemas de CORS).

> Si el proyecto está dentro de **OneDrive** y `npm install` falla con `EPERM`/`EBUSY`, pausa la
> sincronización o mueve la carpeta fuera de OneDrive (por ejemplo `C:\proyectos\`).

## Pruebas

| Qué | Cómo | Resultado |
|---|---|---|
| Front · pruebas unitarias (Vitest) | `cd forms-updated` → `npm run test:ci` | 102 pruebas |
| Back · pruebas de la API (curl) | Con el back-end corriendo y la base recién creada: `bash preoperacional-back/pruebas/pruebas-api.sh` | 88 casos |

Además, se recorrió la aplicación completa en un navegador real (login, preoperacional, historial,
fotos, gastos, usuarios, cambio de usuario, recarga de página y vista móvil) con el front y el
back-end corriendo juntos sobre MariaDB.
