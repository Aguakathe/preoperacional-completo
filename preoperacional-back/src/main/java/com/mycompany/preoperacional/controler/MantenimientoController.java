package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.MantenimientoDTO;
import com.mycompany.preoperacional.DTO.MantenimientoRequestDTO;
import com.mycompany.preoperacional.service.MantenimientoService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Inspecciones con fotos de estado.
 *   GET    /api/mantenimientos                 -> listado (con fotoIds)
 *   GET    /api/mantenimientos?placa=ABC12G    -> de una placa
 *   GET    /api/mantenimientos?id=X            -> detalle con los metadatos de las fotos
 *   POST   /api/mantenimientos                 -> multipart/form-data:
 *            datos = JSON {placa, kilometraje, fechaInspeccion, inspector, observaciones,
 *                          categorias: ["motor", "llantas", ...]}   (una por foto, en orden)
 *            fotos = archivo (repetir la parte una vez por foto, maximo 10, 10 MB c/u)
 *   DELETE /api/mantenimientos?id=X            -> borra la inspeccion y sus fotos (admin o quien la creo)
 */
@WebServlet("/api/mantenimientos")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,        // 1 MB en memoria; mas grande va a disco temporal
        maxFileSize = 10L * 1024 * 1024,        // 10 MB por foto
        maxRequestSize = 110L * 1024 * 1024)    // 10 fotos + datos
public class MantenimientoController extends ApiServlet {

    private final MantenimientoService service = new MantenimientoService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            Long id = idParam(req, "id");
            if (id != null) {
                MantenimientoDTO m = service.detalle(id);
                if (m == null) {
                    JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Inspección no encontrada");
                    return;
                }
                JsonUtil.ok(resp, m);
                return;
            }
            JsonUtil.ok(resp, service.listar(req.getParameter("placa")));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            if (!esMultipart(req)) {
                JsonUtil.error(resp, HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE,
                        "Envíe multipart/form-data con la parte 'datos' (JSON) y las partes 'fotos' (archivos)");
                return;
            }
            Multipart<MantenimientoRequestDTO> mp = leerMultipart(req, MantenimientoRequestDTO.class, "fotos");
            Long id = service.crear(mp.datos(), mp.archivos(), sesion(req));
            JsonUtil.ok(resp, HttpServletResponse.SC_CREATED, service.detalle(id));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            Long id = idParam(req, "id");
            if (id == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "Debe proporcionar el id");
                return;
            }
            if (!service.eliminar(id, sesion(req))) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Inspección no encontrada");
                return;
            }
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
