package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.LoginRequestDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.service.AuthService;
import com.mycompany.preoperacional.util.JsonUtil;
import com.mycompany.preoperacional.util.SesionUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

/**
 * Sesion.
 *   GET  /api/login  -> usuario de la sesion actual; 204 (sin cuerpo) si no hay sesion.
 *                       El front lo consulta al abrir la app: no es un error que no haya sesion,
 *                       por eso no se responde 401 (que el navegador mostraria como error en consola).
 *   POST /api/login  -> {username, password} inicia sesion y devuelve {id, username, nombre, rol}
 */
@WebServlet("/api/login")
public class AuthController extends ApiServlet {

    private final AuthService authService = new AuthService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        UsuarioDTO usuario = SesionUtil.usuario(req);
        if (usuario == null) {
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            return;
        }
        JsonUtil.ok(resp, usuario);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            LoginRequestDTO login = leerJson(req, LoginRequestDTO.class);
            if (login == null || login.getUsername() == null || login.getPassword() == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_BAD_REQUEST, "Debe indicar usuario y contraseña");
                return;
            }

            UsuarioDTO usuarioDTO = authService.login(login.getUsername(), login.getPassword());
            if (usuarioDTO == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_UNAUTHORIZED, "Usuario o contraseña incorrectos");
                return;
            }

            HttpSession session = req.getSession(true);
            req.changeSessionId(); // evita la fijacion de sesion (session fixation)
            session.setAttribute(SesionUtil.ATRIBUTO, usuarioDTO); // DTO, no Entity

            JsonUtil.ok(resp, usuarioDTO);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
