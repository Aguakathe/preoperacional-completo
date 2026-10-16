package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.service.GastoMantenimientoService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Documento adjunto de un gasto (factura/soporte).
 *   GET /api/gastos/documento?id=X               -> se muestra en el navegador
 *   GET /api/gastos/documento?id=X&descargar=1   -> se descarga
 */
@WebServlet("/api/gastos/documento")
public class GastoDocumentoController extends ApiServlet {

    private final GastoMantenimientoService service = new GastoMantenimientoService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            Long id = idParam(req, "id");
            if (id == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "Debe proporcionar el id");
                return;
            }
            ArchivoDTO archivo = service.documento(id);
            if (archivo == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "El documento no existe");
                return;
            }
            enviarArchivo(resp, archivo, req.getParameter("descargar") != null);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
