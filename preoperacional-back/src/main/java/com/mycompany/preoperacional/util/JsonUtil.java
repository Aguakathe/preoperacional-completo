package com.mycompany.preoperacional.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

/**
 * ObjectMapper compartido: entiende LocalDate / LocalDateTime y no falla si
 * el JSON trae campos que el DTO no tiene (ej. campos calculados del front).
 */
public final class JsonUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

    private JsonUtil() {
    }

    public static ObjectMapper mapper() {
        return MAPPER;
    }

    /** Responde 200 (o el codigo indicado) con el objeto en JSON (UTF-8). */
    public static void ok(HttpServletResponse resp, int status, Object cuerpo) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        MAPPER.writeValue(resp.getWriter(), cuerpo);
    }

    public static void ok(HttpServletResponse resp, Object cuerpo) throws IOException {
        ok(resp, HttpServletResponse.SC_OK, cuerpo);
    }

    /**
     * Responde con un codigo HTTP y {"error": "mensaje"} en JSON (UTF-8).
     * El front muestra directamente el campo "error".
     */
    public static void error(HttpServletResponse resp, int status, String mensaje) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        MAPPER.writeValue(resp.getWriter(), Map.of("error", mensaje == null ? "Error" : mensaje));
    }
}
