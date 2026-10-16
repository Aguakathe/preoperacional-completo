package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.CambioCategoriaDTO;
import com.mycompany.preoperacional.DTO.FotoDTO;
import com.mycompany.preoperacional.service.FotoService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Galeria de fotos (metadatos; el binario esta en /api/fotos/archivo).
 *   GET    /api/fotos                       -> todas, mas recientes primero
 *   GET    /api/fotos?categoria=motor       -> de una categoria
 *   GET    /api/fotos?idMantenimiento=X     -> de una inspeccion
 *   GET    /api/fotos?conteo=1              -> {"general": 3, "motor": 1, ...} (las 8 categorias)
 *   PUT    /api/fotos                       -> cambiar categoria {idFoto, categoria}
 *   DELETE /api/fotos?id=X                  -> eliminar
 *   (PUT y DELETE: solo el admin o quien subio la foto)
 */
@WebServlet("/api/fotos")
public class FotoController extends ApiServlet {

    private final FotoService service = new FotoService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            if (req.getParameter("conteo") != null) {
                JsonUtil.ok(resp, service.conteo());
                return;
            }
            JsonUtil.ok(resp, service.listar(req.getParameter("categoria"), idParam(req, "idMantenimiento")));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            CambioCategoriaDTO cambio = leerJson(req, CambioCategoriaDTO.class);
            FotoDTO foto = service.cambiarCategoria(cambio.getIdFoto(), cambio.getCategoria(), sesion(req));
            if (foto == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "La foto ya no existe");
                return;
            }
            JsonUtil.ok(resp, foto);
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
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "La foto ya no existe");
                return;
            }
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
