package com.mycompany.preoperacional.controler;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.util.JPAUtil;
import com.mycompany.preoperacional.util.JsonUtil;
import com.mycompany.preoperacional.util.SesionUtil;
import jakarta.persistence.PersistenceException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Base comun de los controllers: lectura de JSON y multipart, sesion y la
 * traduccion de excepciones a codigos HTTP, para no repetirla en cada Servlet.
 *
 *   BaseDatosNoDisponible    -> 503 MySQL apagado (se reintenta en la siguiente peticion)
 *   IllegalArgumentException -> 400 datos invalidos
 *   SecurityException        -> 403 sin permiso
 *   IllegalStateException    -> 409 conflicto de negocio
 *   otro error               -> 500
 */
public abstract class ApiServlet extends HttpServlet {

    protected final ObjectMapper mapper = JsonUtil.mapper();

    /**
     * Red de seguridad: si algo se escapa de los doGet/doPost (incluso un Error
     * de la JVM), se responde JSON en vez de la pagina HTML de Tomcat con el
     * detalle interno del error.
     */
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            super.service(req, resp);
        } catch (RuntimeException | Error e) {
            log("Error no controlado en " + req.getMethod() + " " + req.getRequestURI(), e);
            if (!resp.isCommitted()) {
                resp.reset();
                if (e instanceof RuntimeException re) {
                    manejarError(resp, re);
                } else {
                    JsonUtil.error(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error interno del servidor");
                }
            }
        }
    }

    /** Usuario de la sesion (AuthFilter garantiza que existe en las rutas protegidas). */
    protected UsuarioDTO sesion(HttpServletRequest req) {
        return SesionUtil.usuario(req);
    }

    /** 403 si el usuario no es admin. @return true si puede continuar */
    protected boolean exigirAdmin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!SesionUtil.esAdmin(req)) {
            JsonUtil.error(resp, HttpServletResponse.SC_FORBIDDEN, "Solo un administrador puede hacer esta operación");
            return false;
        }
        return true;
    }

    protected <T> T leerJson(HttpServletRequest req, Class<T> tipo) throws IOException {
        return mapper.readValue(req.getInputStream(), tipo);
    }

    /** Parametro numerico opcional: null si no viene, 400 (via excepcion) si no es numero. */
    protected Long idParam(HttpServletRequest req, String nombre) {
        String v = req.getParameter(nombre);
        if (v == null || v.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(v.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("El parámetro '" + nombre + "' debe ser un número");
        }
    }

    protected boolean esMultipart(HttpServletRequest req) {
        String ct = req.getContentType();
        return ct != null && ct.toLowerCase().startsWith("multipart/");
    }

    /**
     * Lee de un multipart la parte JSON "datos" y los archivos con el nombre
     * indicado (ej. "fotos" o "documentos"). Se llama dentro de un Servlet
     * anotado con @MultipartConfig.
     */
    protected <T> Multipart<T> leerMultipart(HttpServletRequest req, Class<T> tipoDatos, String nombreArchivos)
            throws IOException, ServletException {
        T datos = null;
        List<ArchivoDTO> archivos = new ArrayList<>();
        try {
            for (Part part : req.getParts()) {
                if ("datos".equals(part.getName())) {
                    try (InputStream in = part.getInputStream()) {
                        datos = mapper.readValue(in, tipoDatos);
                    }
                } else if (nombreArchivos.equals(part.getName()) && part.getSubmittedFileName() != null) {
                    try (InputStream in = part.getInputStream()) {
                        archivos.add(new ArchivoDTO(part.getSubmittedFileName(), part.getContentType(), in.readAllBytes()));
                    }
                }
            }
        } catch (IllegalStateException e) {
            // Tomcat lanza IllegalStateException cuando se supera maxFileSize / maxRequestSize
            throw new ArchivoDemasiadoGrandeException();
        }
        return new Multipart<>(datos, archivos);
    }

    /** Envia un archivo binario (foto o documento) para mostrarlo o descargarlo. */
    protected void enviarArchivo(HttpServletResponse resp, ArchivoDTO archivo, boolean descargar) throws IOException {
        resp.setContentType(archivo.getTipo());
        resp.setContentLengthLong(archivo.getTamano());
        String nombre = URLEncoder.encode(archivo.getNombre(), StandardCharsets.UTF_8).replace("+", "%20");
        resp.setHeader("Content-Disposition",
                (descargar ? "attachment" : "inline") + "; filename*=UTF-8''" + nombre);
        resp.setHeader("Cache-Control", "private, max-age=86400");
        resp.setHeader("X-Content-Type-Options", "nosniff");
        resp.getOutputStream().write(archivo.getDatos());
    }

    /** Traduce las excepciones de negocio a respuestas HTTP con {"error": "..."}. */
    protected void manejarError(HttpServletResponse resp, Exception e) throws IOException {
        if (e instanceof JPAUtil.BaseDatosNoDisponibleException) {
            JsonUtil.error(resp, HttpServletResponse.SC_SERVICE_UNAVAILABLE, e.getMessage());
        } else if (e instanceof JacksonException) {
            JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "JSON inválido: revise el formato de los campos");
        } else if (e instanceof ArchivoDemasiadoGrandeException) {
            JsonUtil.error(resp, HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE, e.getMessage());
        } else if (e instanceof IllegalArgumentException) {
            JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } else if (e instanceof SecurityException) {
            JsonUtil.error(resp, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
        } else if (e instanceof IllegalStateException) {
            JsonUtil.error(resp, HttpServletResponse.SC_CONFLICT, e.getMessage());
        } else {
            log("Error no controlado", e);
            String msg = e instanceof PersistenceException
                    ? "Error de base de datos. Revise el log del servidor."
                    : "Error interno del servidor";
            JsonUtil.error(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, msg);
        }
    }

    /** Resultado de leer un multipart: la parte "datos" ya convertida + los archivos. */
    protected record Multipart<T>(T datos, List<ArchivoDTO> archivos) {
    }

    /** Se supero el tamano maximo permitido para la peticion. */
    protected static class ArchivoDemasiadoGrandeException extends RuntimeException {

        ArchivoDemasiadoGrandeException() {
            super("Los archivos superan el tamaño máximo permitido");
        }
    }
}
