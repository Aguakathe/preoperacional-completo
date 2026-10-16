package com.mycompany.preoperacional.controler;

import com.mycompany.preoperacional.DTO.UsuarioListadoDTO;
import com.mycompany.preoperacional.DTO.UsuarioRequestDTO;
import com.mycompany.preoperacional.service.UsuarioService;
import com.mycompany.preoperacional.util.JsonUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Usuarios (SOLO ADMIN).
 *   GET  /api/usuarios   -> listado (sin contrasenas)
 *   POST /api/usuarios   -> crear {username, password, nombre?, email?, rol? ("usuario" por defecto)}
 *   PUT  /api/usuarios   -> editar {idUsuario, nombre?, email?, rol?, estado?, password?}
 *                           (estado=false desactiva; no se puede quedar sin admin activo)
 */
@WebServlet("/api/usuarios")
public class UsuarioController extends ApiServlet {

    private final UsuarioService service = new UsuarioService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!exigirAdmin(req, resp)) return;
        try {
            JsonUtil.ok(resp, service.listar());
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!exigirAdmin(req, resp)) return;
        try {
            UsuarioListadoDTO creado = service.crear(leerJson(req, UsuarioRequestDTO.class));
            JsonUtil.ok(resp, HttpServletResponse.SC_CREATED, creado);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!exigirAdmin(req, resp)) return;
        try {
            UsuarioListadoDTO u = service.actualizar(leerJson(req, UsuarioRequestDTO.class), sesion(req).getId());
            if (u == null) {
                JsonUtil.error(resp, HttpServletResponse.SC_NOT_FOUND, "Usuario no encontrado");
                return;
            }
            JsonUtil.ok(resp, u);
        } catch (Exception e) {
            manejarError(resp, e);
        }
    }
}
