package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.DTO.GastoDTO;
import com.mycompany.preoperacional.DTO.GastoRequestDTO;
import com.mycompany.preoperacional.service.GastoMantenimientoService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Gastos de mantenimiento.
 *   GET    /api/gastos                    -> listado (mas recientes primero, con sus documentos)
 *   GET    /api/gastos?placa=ABC12G       -> de una placa
 *   GET    /api/gastos?id=X               -> detalle
 *   GET    /api/gastos?resumen=1          -> {cantidad, total, promedio} (admite &placa=)
 *   POST   /api/gastos                    -> crear. Dos formas:
 *            a) application/json con los campos del formulario (sin documentos)
 *            b) multipart/form-data: datos = JSON del formulario,
 *               documentos = archivo (repetir por cada PDF/JPG/PNG, 5 MB c/u)
 *   DELETE /api/gastos?id=X               -> eliminar (admin o quien lo registro)
 */
@WebServlet("/api/gastos")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 5L * 1024 * 1024,         // 5 MB por documento
        maxRequestSize = 55L * 1024 * 1024)     // 10 documentos + datos
public class GastoMantenimientoController extends ApiServlet {

    private final GastoMantenimientoService service = new GastoMantenimientoService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            if (req.getParameter("resumen") != null) {
                JsonUtil.ok(resp, service.resumen(req.getParameter("placa")));
                return;
            }
            Long id = idParam(req, "id");
            if (id != null) {
                GastoDTO g = service.detalle(id);
                if (g == null) {
                    JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Gasto no encontrado");
                    return;
                }
                JsonUtil.ok(resp, g);
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
            GastoRequestDTO datos;
            List<ArchivoDTO> documentos;
            if (esMultipart(req)) {
                Multipart<GastoRequestDTO> mp = leerMultipart(req, GastoRequestDTO.class, "documentos");
                datos = mp.datos();
                documentos = mp.archivos();
            } else {
                datos = leerJson(req, GastoRequestDTO.class);
                documentos = List.of();
            }
            Long id = service.crear(datos, documentos, sesion(req));
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
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Gasto no encontrado");
                return;
            }
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
