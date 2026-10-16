package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.service.FotoService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Imagen de una foto (para usar directo en un <img src>; requiere sesion).
 *   GET /api/fotos/archivo?id=X                -> se muestra en el navegador
 *   GET /api/fotos/archivo?id=X&descargar=1    -> se descarga
 */
@WebServlet("/api/fotos/archivo")
public class FotoArchivoController extends ApiServlet {

    private final FotoService service = new FotoService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            Long id = idParam(req, "id");
            if (id == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "Debe proporcionar el id");
                return;
            }
            ArchivoDTO archivo = service.archivo(id);
            if (archivo == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "La foto no existe");
                return;
            }
            enviarArchivo(resp, archivo, req.getParameter("descargar") != null);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
