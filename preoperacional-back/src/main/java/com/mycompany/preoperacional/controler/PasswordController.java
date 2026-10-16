package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.CambioPasswordDTO;
import com.mycompany.preoperacional.service.AuthService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

/**
 * Cambio de contrasena (ruta libre en AuthFilter).
 *   PUT /api/password
 *     - Con sesion iniciada:  {passwordActual, passwordNueva}
 *     - Desde el login:       {username, passwordActual, passwordNueva}
 */
@WebServlet("/api/password")
public class PasswordController extends ApiServlet {

    private final AuthService authService = new AuthService();

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            CambioPasswordDTO cambio = leerJson(req, CambioPasswordDTO.class);
            authService.cambiarPassword(sesion(req), cambio);
            JsonUtil.ok(resp, Map.of("mensaje", "Contraseña actualizada"));
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    /** Alias de PUT para clientes que solo envian POST. */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        doPut(req, resp);
    }
}
