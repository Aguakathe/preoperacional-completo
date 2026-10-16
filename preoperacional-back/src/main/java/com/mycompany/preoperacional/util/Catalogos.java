package com.mycompany.preoperacional.util;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Listas fijas del sistema. Son las MISMAS que usa el front Angular
 * (src/app/models/preoperacional.ts, foto.ts y gasto.ts)
 * y se usan para validar lo que llega a la API. GET /api/catalogos las publica.
 */
public final class Catalogos {

    private Catalogos() {
    }

    /** Placa de moto colombiana: 3 letras + 2 numeros + 1 letra (ej. ABC12G). */
    public static final Pattern PLACA = Pattern.compile("^[A-Z]{3}[0-9]{2}[A-Z]$");

    public static final int PASSWORD_MIN = 4;

    /** Zona horaria de la operacion (para "hoy" en las validaciones de fecha). */
    public static final java.time.ZoneId ZONA = java.time.ZoneId.of("America/Bogota");

    public static java.time.LocalDate hoy() {
        return java.time.LocalDate.now(ZONA);
    }

    // ---------- Respuestas del preoperacional ----------
    public static final String SI = "si";
    public static final String NO = "no";
    public static final String BUEN_ESTADO = "buen_estado";
    public static final String MAL_ESTADO = "mal_estado";

    // ---------- Elementos del preoperacional (numeracion 1-28 del formato en papel) ----------
    public static final List<String> DOCUMENTACION = List.of(
            "Licencia de Conducción",
            "Licencia de Tránsito vehículo",
            "Seguro Obligatorio",
            "Revisión tecnicomecánica");

    public static final List<String> ESTADO_GENERAL = List.of(
            "Llantas y Rines (Labrado y presión)",
            "Espejos Retrovisores izquierdo y derecho",
            "Cojinería y asientos",
            "Estado del tanque de combustible",
            "Tubo de escape/exhosto",
            "Reposapies");

    public static final List<String> ESTADO_MECANICO = List.of(
            "Funcionamiento del Clutch",
            "Funcionamiento de frenos",
            "Funcionamiento acelerador",
            "Nivel aceite motor",
            "Nivel líquido de frenos",
            "Fuga de líquidos (gasolina, aceite)",
            "Funcionamiento dirección",
            "Estado de Batería",
            "Amortiguadores",
            "Estado de guayas");

    public static final List<String> ESTADO_SISTEMAS = List.of(
            "Luces altas y bajas",
            "Luces direccionales delanteros y traseros",
            "Luces traseras (cocuyos)",
            "Stop y Luz de freno",
            "Velocímetro",
            "Odómetro",
            "Encendido",
            "Testigos de tablero",
            "Bocina",
            "Herramientas básicas",
            "Casco con visor acrílico (marcado con placa)",
            "Chaleco reflectivo");

    /** Categorias del paso 6 del formulario: clave -> elementos validos. */
    public static final Map<String, List<String>> CATEGORIAS_PREOPERACIONAL = ordenado(
            "documentacion", DOCUMENTACION,
            "estadoGeneral", ESTADO_GENERAL,
            "estadoMecanico", ESTADO_MECANICO,
            "estadoSistemas", ESTADO_SISTEMAS);

    /** Preguntas del paso 4 (certificacion de salud), en orden. */
    public static final List<String> PREGUNTAS_SALUD = List.of(
            "No estando bajo efecto del alcohol",
            "No estando bajo efectos de sustancias alucinógenas o psicoactivas",
            "Haciendo uso de gafas si le han sido recetadas",
            "Estando sin fatiga por horas de conducción o con sueño",
            "No estando bajo el efecto de medicamentos que produzcan somnolencia, fatiga o disminuyan las capacidades para la conducción",
            "Siendo consciente de No usar distractores en la conducción (celular, alimentación, maquillarse, etc)",
            "Conociendo y comprometiéndose al respeto de las políticas y lineamientos de seguridad y salud en el trabajo y seguridad vial de NCR y al cumplimiento de las normas de tránsito");

    // ---------- Fotos ----------
    /** id -> nombre visible. Los ids son los mismos del front (models/foto.ts). */
    public static final Map<String, String> CATEGORIAS_FOTO = ordenado(
            "general", "Vista General",
            "motor", "Motor",
            "llantas", "Llantas",
            "frenos", "Frenos",
            "luces", "Luces",
            "carroceria", "Carrocería",
            "interior", "Interior",
            "documentos", "Documentos");

    public static final String CATEGORIA_FOTO_POR_DEFECTO = "general";
    public static final int MAX_FOTOS = 10;
    public static final long MAX_BYTES_FOTO = 10L * 1024 * 1024;
    public static final List<String> TIPOS_FOTO = List.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    // ---------- Gastos ----------
    public static final Map<String, String> TIPOS_GASTO = ordenado(
            "preventivo", "Mantenimiento preventivo",
            "correctivo", "Mantenimiento correctivo",
            "repuestos", "Repuestos",
            "lubricantes", "Lubricantes",
            "neumaticos", "Neumáticos",
            "bateria", "Batería",
            "frenos", "Sistema de frenos",
            "electrico", "Sistema eléctrico",
            "otro", "Otro");

    public static final Map<String, String> FORMAS_PAGO = ordenado(
            "efectivo", "Efectivo",
            "tarjeta_credito", "Tarjeta de crédito",
            "tarjeta_debito", "Tarjeta de débito",
            "transferencia", "Transferencia bancaria",
            "cheque", "Cheque",
            "otro", "Otro");

    public static final long MAX_BYTES_DOCUMENTO = 5L * 1024 * 1024;
    public static final List<String> TIPOS_DOCUMENTO = List.of("application/pdf", "image/jpeg", "image/jpg", "image/png");

    // ---------- auxiliares ----------

    /** Normaliza una placa: mayusculas y sin simbolos (igual que el front). */
    public static String normalizarPlaca(String placa) {
        return placa == null ? "" : placa.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    public static void validarPlaca(String placa) {
        if (!PLACA.matcher(placa).matches()) {
            throw new IllegalArgumentException("Placa inválida: use el formato ABC12G (3 letras, 2 números y 1 letra)");
        }
    }

    /** Devuelve el texto sin espacios extremos o null si viene vacio. */
    public static String limpio(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** Valida que un texto obligatorio venga y no exceda el largo de la columna. */
    public static String requerido(String valor, String campo, int max) {
        String v = limpio(valor);
        if (v == null) {
            throw new IllegalArgumentException("El campo '" + campo + "' es obligatorio");
        }
        return maximo(v, campo, max);
    }

    public static String maximo(String valor, String campo, int max) {
        if (valor != null && valor.length() > max) {
            throw new IllegalArgumentException("El campo '" + campo + "' admite máximo " + max + " caracteres");
        }
        return valor;
    }

    @SuppressWarnings("unchecked")
    private static <V> Map<String, V> ordenado(Object... pares) {
        Map<String, V> m = new LinkedHashMap<>();
        for (int i = 0; i < pares.length; i += 2) {
            m.put((String) pares[i], (V) pares[i + 1]);
        }
        return java.util.Collections.unmodifiableMap(m);
    }
}
