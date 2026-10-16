package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GET /api/catalogos -> listas fijas que valida el servidor (las mismas del front):
 * elementos del preoperacional por categoria, preguntas de salud, categorias de
 * foto, tipos de gasto, formas de pago y limites de archivos.
 */
@WebServlet("/api/catalogos")
public class CatalogoController extends ApiServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("elementosPreoperacional", Catalogos.CATEGORIAS_PREOPERACIONAL);
        c.put("preguntasSalud", Catalogos.PREGUNTAS_SALUD);
        c.put("categoriasFoto", Catalogos.CATEGORIAS_FOTO);
        c.put("tiposGasto", Catalogos.TIPOS_GASTO);
        c.put("formasPago", Catalogos.FORMAS_PAGO);
        c.put("limites", Map.of(
                "maxFotos", Catalogos.MAX_FOTOS,
                "maxBytesFoto", Catalogos.MAX_BYTES_FOTO,
                "tiposFoto", Catalogos.TIPOS_FOTO,
                "maxBytesDocumento", Catalogos.MAX_BYTES_DOCUMENTO,
                "tiposDocumento", Catalogos.TIPOS_DOCUMENTO,
                "passwordMin", Catalogos.PASSWORD_MIN));
        JsonUtil.ok(resp, c);
    }
}
