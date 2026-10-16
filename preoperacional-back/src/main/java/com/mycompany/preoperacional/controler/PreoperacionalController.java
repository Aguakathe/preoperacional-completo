package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.PreoperacionalDTO;
import com.mycompany.preoperacional.DTO.PreoperacionalRequestDTO;
import com.mycompany.preoperacional.service.PreoperacionalService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

/**
 * Formularios preoperacionales.
 *   GET    /api/preoperacionales                    -> listado (usuario: los suyos; admin: todos)
 *   GET    /api/preoperacionales?placa=ABC12G       -> filtrar por placa
 *   GET    /api/preoperacionales?desde=2026-10-01&hasta=2026-10-31 -> filtrar por fecha de envio
 *   GET    /api/preoperacionales?id=X               -> detalle (salud, elementos, confirmaciones)
 *   POST   /api/preoperacionales                    -> registrar (JSON igual al que arma el front)
 *   DELETE /api/preoperacionales?id=X               -> eliminar (solo admin)
 */
@WebServlet("/api/preoperacionales")
public class PreoperacionalController extends ApiServlet {

    private final PreoperacionalService service = new PreoperacionalService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            Long id = idParam(req, "id");
            if (id != null) {
                PreoperacionalDTO p = service.detalle(id, sesion(req));
                if (p == null) {
                    JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Preoperacional no encontrado");
                    return;
                }
                JsonUtil.ok(resp, p);
                return;
            }
            JsonUtil.ok(resp, service.listar(sesion(req), req.getParameter("placa"),
                    fecha(req, "desde"), fecha(req, "hasta")));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    /** Registra el preoperacional; responde 201 con el detalle (incluye aptoParaConducir). */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            PreoperacionalRequestDTO datos = leerJson(req, PreoperacionalRequestDTO.class);
            Long id = service.crear(datos, sesion(req));
            JsonUtil.ok(resp, HttpServletResponse.SC_CREATED, service.detalle(id, sesion(req)));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!exigirAdmin(req, resp)) return;
        try {
            Long id = idParam(req, "id");
            if (id == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "Debe proporcionar el id");
                return;
            }
            if (!service.eliminar(id)) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Preoperacional no encontrado");
                return;
            }
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    private static LocalDate fecha(HttpServletRequest req, String nombre) {
        String v = req.getParameter(nombre);
        if (v == null || v.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(v.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("El parámetro '" + nombre + "' debe tener el formato AAAA-MM-DD");
        }
    }
}
