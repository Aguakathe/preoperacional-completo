#!/usr/bin/env bash
# Pruebas de humo de la API del preoperacional. Imprime OK/FALLA por caso.
# Uso: con la app desplegada y la base recien creada ->  bash pruebas/pruebas-api.sh
# (otra URL:  API=http://servidor:8080/preoperacional/api bash pruebas/pruebas-api.sh)
# Requiere curl y python3. Crea usuarios y datos de prueba en la base.
B=${API:-http://localhost:8080/preoperacional/api}
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT
A="$D/admin.cj"; U="$D/usuario.cj"
pasa=0; falla=0

check() { # nombre esperado obtenido [cuerpo]
  if [ "$2" == "$3" ]; then echo "OK    $1 ($3)"; pasa=$((pasa+1));
  else echo "FALLA $1: esperado $2, obtenido $3 :: $(head -c 300 "$D/out")"; falla=$((falla+1)); fi
}
req() { # cookiejar metodo url [args curl...] -> codigo HTTP, cuerpo en $D/out
  local cj=$1 m=$2 url=$3; shift 3
  curl -s -o "$D/out" -w "%{http_code}" -b "$cj" -c "$cj" -X "$m" "$B$url" "$@"
}
json() { python3 -c "import sys,json; d=json.load(open('$D/out')); print($1)"; }

# ---------- archivos de prueba ----------
python3 - "$D" <<'EOF'
import sys, struct, zlib
d = sys.argv[1]
def png(path, w=4, h=4):
    raw = b''.join(b'\x00' + b'\xff\x00\x00' * w for _ in range(h))
    def ch(t, data): return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw)) + ch(b'IEND', b''))
png(f'{d}/motor.png'); png(f'{d}/llanta.png')
open(f'{d}/factura.pdf', 'wb').write(b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
open(f'{d}/nota.txt', 'w').write('no soy imagen')
open(f'{d}/grande.png', 'wb').write(b'\x89PNG' + b'0' * (11 * 1024 * 1024))
EOF

echo "== Sesion y usuarios"
check "sin sesion -> 401" 401 "$(req "$D/x.cj" GET /preoperacionales)"
check "GET /login sin sesion -> 204 (no es error)" 204 "$(req "$D/x.cj" GET /login)"
check "login malo -> 401" 401 "$(req "$A" POST /login -H 'Content-Type: application/json' -d '{"username":"admin","password":"mal"}')"
check "login admin" 200 "$(req "$A" POST /login -H 'Content-Type: application/json' -d '{"username":"Admin","password":"12345"}')"
check "rol admin" admin "$(json "d['rol']")"
check "login usuario" 200 "$(req "$U" POST /login -H 'Content-Type: application/json' -d '{"username":"usuario","password":"123456"}')"
check "GET /login" 200 "$(req "$U" GET /login)"
check "usuario no lista usuarios -> 403" 403 "$(req "$U" GET /usuarios)"
check "admin lista usuarios" 200 "$(req "$A" GET /usuarios)"
check "admin crea conductor" 201 "$(req "$A" POST /usuarios -H 'Content-Type: application/json' -d '{"username":"jperez","password":"clave1","nombre":"Juan Pérez"}')"
check "rol por defecto usuario" usuario "$(json "d['rol']")"
ID_JP=$(json "d['id']")
check "usuario duplicado -> 409" 409 "$(req "$A" POST /usuarios -H 'Content-Type: application/json' -d '{"username":"JPEREZ","password":"clave1"}')"
check "password corta -> 400" 400 "$(req "$A" POST /usuarios -H 'Content-Type: application/json' -d '{"username":"otro","password":"12"}')"
check "cambiar password sin sesion (desde login)" 200 "$(req "$D/y.cj" PUT /password -H 'Content-Type: application/json' -d '{"username":"jperez","passwordActual":"clave1","passwordNueva":"clave2"}')"
check "cambiar password con clave mala -> 403" 403 "$(req "$D/y.cj" PUT /password -H 'Content-Type: application/json' -d '{"username":"jperez","passwordActual":"clave1","passwordNueva":"clave3"}')"
check "login con clave nueva" 200 "$(req "$D/jp.cj" POST /login -H 'Content-Type: application/json' -d '{"username":"jperez","password":"clave2"}')"
check "admin desactiva usuario" 200 "$(req "$A" PUT /usuarios -H 'Content-Type: application/json' -d "{\"idUsuario\":$ID_JP,\"estado\":false}")"
check "usuario desactivado no entra -> 401" 401 "$(req "$D/jp2.cj" POST /login -H 'Content-Type: application/json' -d '{"username":"jperez","password":"clave2"}')"
check "no quedarse sin admin -> 409" 409 "$(req "$A" PUT /usuarios -H 'Content-Type: application/json' -d '{"idUsuario":1,"rol":"usuario"}')"

echo "== Preoperacional"
SALUD='[{"pregunta":"No estando bajo efecto del alcohol","respuesta":"si"},{"pregunta":"No estando bajo efectos de sustancias alucinógenas o psicoactivas","respuesta":"si"},{"pregunta":"Haciendo uso de gafas si le han sido recetadas","respuesta":"si"},{"pregunta":"Estando sin fatiga por horas de conducción o con sueño","respuesta":"si"},{"pregunta":"No estando bajo el efecto de medicamentos que produzcan somnolencia, fatiga o disminuyan las capacidades para la conducción","respuesta":"si"},{"pregunta":"Siendo consciente de No usar distractores en la conducción (celular, alimentación, maquillarse, etc)","respuesta":"si"},{"pregunta":"Conociendo y comprometiéndose al respeto de las políticas y lineamientos de seguridad y salud en el trabajo y seguridad vial de NCR y al cumplimiento de las normas de tránsito","respuesta":"%S7%"}]'
pre() { # malEstado chequeoSistemas salud7 detalle confirm
  echo "{\"conoceCampana\":\"si\",\"qlid\":\"AB123456\",\"nombreCompleto\":\"Ana Gómez\",\"placaMoto\":\"abc-12g\",\"kilometraje\":15400,
  \"documentacionVigente\":\"buen_estado\",\"estadoGeneralVehiculo\":\"buen_estado\",\"estadoSistemasAccesorios\":\"$2\",
  \"saludItems\":${SALUD/\%S7\%/$3},\"elementosMalEstado\":\"$1\",\"elementosNoCumplen\":$4,\"confirmaciones\":$5,
  \"fechaEnvio\":\"2026-10-16T18:00:00.000Z\",\"timestamp\":1760000000000}"
}
DET='{"documentacion":{"perfectoEstado":true,"elementos":[]},"estadoGeneral":{"perfectoEstado":true,"elementos":[]},"estadoMecanico":{"perfectoEstado":false,"elementos":["Nivel aceite motor"]},"estadoSistemas":{"perfectoEstado":false,"elementos":["Bocina","Odómetro"]}}'
CONF='{"confirmacionInsegura":"no","confirmacionInspeccion":"si"}'
check "registrar todo bien (usuario)" 201 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre no buen_estado si null "$CONF")")"
check "placa normalizada" ABC12G "$(json "d['placaMoto']")"
check "apto para conducir" True "$(json "d['aptoParaConducir']")"
ID_P1=$(json "d['id']")
check "registrar con mal estado + salud no" 201 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre si mal_estado no "$DET" null)")"
check "no apto (salud=no)" False "$(json "d['aptoParaConducir']")"
check "elementos guardados" "['Bocina', 'Odómetro']" "$(json "d['elementosNoCumplen']['estadoSistemas']['elementos']")"
ID_P2=$(json "d['id']")
check "incoherencia paso 3 vs 5 -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre no mal_estado si null "$CONF")")"
check "mensaje incoherencia" True "$(json "'Mal estado' in d['error']")"
check "faltan confirmaciones -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre no buen_estado si null null)")"
check "elemento fuera de catalogo -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre si buen_estado si '{"documentacion":{"perfectoEstado":false,"elementos":["Inventado"]},"estadoGeneral":{"perfectoEstado":true},"estadoMecanico":{"perfectoEstado":true},"estadoSistemas":{"perfectoEstado":true}}' null)")"
check "todas perfectas pero dijo si -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre si buen_estado si '{"documentacion":{"perfectoEstado":true},"estadoGeneral":{"perfectoEstado":true},"estadoMecanico":{"perfectoEstado":true},"estadoSistemas":{"perfectoEstado":true}}' null)")"
check "placa invalida -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' -d '{"conoceCampana":"si","qlid":"x","nombreCompleto":"x","placaMoto":"AB123","kilometraje":1}')"
check "JSON roto -> 400" 400 "$(req "$U" POST /preoperacionales -H 'Content-Type: application/json' -d '{roto')"
check "admin registra uno" 201 "$(req "$A" POST /preoperacionales -H 'Content-Type: application/json' --data-binary "$(pre no buen_estado si null "$CONF")")"
check "usuario ve solo los suyos (2)" 2 "$(req "$U" GET /preoperacionales >/dev/null; json "len(d)")"
check "admin ve todos (3)" 3 "$(req "$A" GET /preoperacionales >/dev/null; json "len(d)")"
check "filtro por placa" 3 "$(req "$A" GET '/preoperacionales?placa=ABC12G' >/dev/null; json "len(d)")"
check "filtro por fecha" 3 "$(req "$A" GET "/preoperacionales?desde=$(date +%F)&hasta=$(date +%F)" >/dev/null; json "len(d)")"
check "detalle propio" 200 "$(req "$U" GET "/preoperacionales?id=$ID_P2")"
check "detalle trae 7 respuestas de salud" 7 "$(json "len(d['saludItems'])")"
ID_PA=$(req "$A" GET /preoperacionales >/dev/null; json "d[0]['id']")
check "usuario no ve el del admin -> 403" 403 "$(req "$U" GET "/preoperacionales?id=$ID_PA")"
check "usuario no elimina -> 403" 403 "$(req "$U" DELETE "/preoperacionales?id=$ID_P1")"
check "admin elimina" 204 "$(req "$A" DELETE "/preoperacionales?id=$ID_P1")"
check "eliminado ya no existe -> 404" 404 "$(req "$A" GET "/preoperacionales?id=$ID_P1")"
check "id no numerico -> 400" 400 "$(req "$A" GET "/preoperacionales?id=abc")"

echo "== Fotos e inspecciones"
check "inspeccion con 2 fotos" 201 "$(req "$U" POST /mantenimientos -F 'datos={"placa":"XYZ98A","kilometraje":2000,"fechaInspeccion":"2026-10-15","inspector":"Luis","observaciones":"ok","categorias":["motor","llantas"]};type=application/json' -F "fotos=@$D/motor.png;type=image/png" -F "fotos=@$D/llanta.png;type=image/png")"
check "2 fotos guardadas" 2 "$(json "len(d['fotos'])")"
ID_M=$(json "d['id']"); ID_F1=$(json "d['fotos'][-1]['id']"); URL_F1=$(json "d['fotos'][-1]['url']")
check "categoria de la primera" motor "$(json "[f['categoria'] for f in d['fotos'] if f['id']==$ID_F1][0]")"
check "sin fotos -> 400" 400 "$(req "$U" POST /mantenimientos -F 'datos={"placa":"XYZ98A","kilometraje":1,"fechaInspeccion":"2026-10-15","inspector":"Luis"};type=application/json')"
check "archivo no imagen -> 400" 400 "$(req "$U" POST /mantenimientos -F 'datos={"placa":"XYZ98A","kilometraje":1,"fechaInspeccion":"2026-10-15","inspector":"Luis"};type=application/json' -F "fotos=@$D/nota.txt;type=text/plain")"
check "foto de 11MB -> 413" 413 "$(req "$U" POST /mantenimientos -F 'datos={"placa":"XYZ98A","kilometraje":1,"fechaInspeccion":"2026-10-15","inspector":"Luis"};type=application/json' -F "fotos=@$D/grande.png;type=image/png")"
check "fecha futura -> 400" 400 "$(req "$U" POST /mantenimientos -F 'datos={"placa":"XYZ98A","kilometraje":1,"fechaInspeccion":"2099-01-01","inspector":"Luis"};type=application/json' -F "fotos=@$D/motor.png;type=image/png")"
check "JSON en vez de multipart -> 415" 415 "$(req "$U" POST /mantenimientos -H 'Content-Type: application/json' -d '{}')"
check "listar inspecciones" 1 "$(req "$A" GET /mantenimientos >/dev/null; json "len(d)")"
check "fotoIds en el listado" 2 "$(json "len(d[0]['fotoIds'])")"
check "listar fotos de motor" 1 "$(req "$A" GET '/fotos?categoria=motor' >/dev/null; json "len(d)")"
check "conteo por categoria" "1 1 0" "$(req "$A" GET '/fotos?conteo=1' >/dev/null; json "f\"{d['motor']} {d['llantas']} {d['general']}\"")"
curl -s -o "$D/descargada.png" -b "$U" "${B%/api}/$URL_F1"
check "descarga identica al original" ok "$(cmp -s "$D/descargada.png" "$D/motor.png" && echo ok || echo distinta)"
check "foto sin sesion -> 401" 401 "$(curl -s -o /dev/null -w '%{http_code}' "${B%/api}/$URL_F1")"
check "mover a frenos (dueno)" 200 "$(req "$U" PUT /fotos -H 'Content-Type: application/json' -d "{\"idFoto\":$ID_F1,\"categoria\":\"frenos\"}")"
check "categoria invalida -> 400" 400 "$(req "$U" PUT /fotos -H 'Content-Type: application/json' -d "{\"idFoto\":$ID_F1,\"categoria\":\"ruedas\"}")"
check "login otro conductor" 201 "$(req "$A" POST /usuarios -H 'Content-Type: application/json' -d '{"username":"maria","password":"clave1"}')"
req "$D/maria.cj" POST /login -H 'Content-Type: application/json' -d '{"username":"maria","password":"clave1"}' >/dev/null
check "otro usuario no mueve foto ajena -> 403" 403 "$(req "$D/maria.cj" PUT /fotos -H 'Content-Type: application/json' -d "{\"idFoto\":$ID_F1,\"categoria\":\"motor\"}")"
check "otro usuario no borra foto ajena -> 403" 403 "$(req "$D/maria.cj" DELETE "/fotos?id=$ID_F1")"
check "admin borra foto" 204 "$(req "$A" DELETE "/fotos?id=$ID_F1")"
check "queda 1 foto" 1 "$(req "$A" GET "/fotos?idMantenimiento=$ID_M" >/dev/null; json "len(d)")"
check "dueno borra inspeccion" 204 "$(req "$U" DELETE "/mantenimientos?id=$ID_M")"
check "fotos borradas en cascada" 0 "$(req "$A" GET /fotos >/dev/null; json "len(d)")"

echo "== Gastos"
G='{"placa":"ABC12G","kilometraje":16000,"fechaGasto":"2026-10-10","tipoGasto":"preventivo","descripcion":"Cambio de aceite","proveedor":"Taller Sur","valorGasto":85000.456,"formaPago":"efectivo","kilometrajeAnterior":15000,"proximoMantenimiento":19000}'
check "gasto JSON" 201 "$(req "$U" POST /gastos -H 'Content-Type: application/json' -d "$G")"
check "valor redondeado a 2 decimales" 85000.46 "$(json "d['valorGasto']")"
ID_G1=$(json "d['id']")
check "gasto multipart con factura" 201 "$(req "$U" POST /gastos -F "datos=${G/85000.456/14999.54};type=application/json" -F "documentos=@$D/factura.pdf;type=application/pdf")"
check "documento adjunto" factura.pdf "$(json "d['documentos'][0]['name']")"
URL_DOC=$(json "d['documentos'][0]['url']")
curl -s -o "$D/factura-desc.pdf" -b "$U" "${B%/api}/$URL_DOC"
check "documento descargado identico" ok "$(cmp -s "$D/factura-desc.pdf" "$D/factura.pdf" && echo ok || echo distinto)"
check "km anterior > actual -> 400" 400 "$(req "$U" POST /gastos -H 'Content-Type: application/json' -d "${G/15000/17000}")"
check "proximo <= actual -> 400" 400 "$(req "$U" POST /gastos -H 'Content-Type: application/json' -d "${G/19000/16000}")"
check "tipo invalido -> 400" 400 "$(req "$U" POST /gastos -H 'Content-Type: application/json' -d "${G/preventivo/lavado}")"
check "valor 0 -> 400" 400 "$(req "$U" POST /gastos -H 'Content-Type: application/json' -d "${G/85000.456/0}")"
check "documento .txt -> 400" 400 "$(req "$U" POST /gastos -F "datos=$G;type=application/json" -F "documentos=@$D/nota.txt;type=text/plain")"
check "resumen" "2 100000.00 50000.00" "$(req "$A" GET '/gastos?resumen=1' >/dev/null; json "f\"{d['cantidad']} {d['total']:.2f} {d['promedio']:.2f}\"")"
check "listar por placa" 2 "$(req "$A" GET '/gastos?placa=abc12g' >/dev/null; json "len(d)")"
check "otro usuario no borra gasto -> 403" 403 "$(req "$D/maria.cj" DELETE "/gastos?id=$ID_G1")"
check "dueno borra gasto" 204 "$(req "$U" DELETE "/gastos?id=$ID_G1")"
check "resumen tras borrar" 1 "$(req "$A" GET '/gastos?resumen=1' >/dev/null; json "d['cantidad']")"

echo "== Varios"
check "catalogos" 8 "$(req "$U" GET /catalogos >/dev/null; json "len(d['categoriasFoto'])")"
check "CORS preflight desde Angular" 204 "$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS -H 'Origin: http://localhost:4200' -H 'Access-Control-Request-Method: POST' $B/preoperacionales)"
check "CORS cabecera" "http://localhost:4200" "$(curl -s -D - -o /dev/null -H 'Origin: http://localhost:4200' $B/login | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin"{print $2}')"
check "CORS origen ajeno sin cabecera" "" "$(curl -s -D - -o /dev/null -H 'Origin: http://malo.com' $B/login | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin"{print $2}')"
check "logout" 204 "$(req "$U" POST /logout)"
check "tras logout -> 401" 401 "$(req "$U" GET /preoperacionales)"

echo; echo "RESULTADO: $pasa OK, $falla FALLAS"
