package com.mycompany.preoperacional.util;

import com.mycompany.preoperacional.DTO.UsuarioDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/** Acceso al usuario guardado en la sesion por AuthController. */
public final class SesionUtil {

    public static final String ATRIBUTO = "usuario";

    private SesionUtil() {
    }

    /** Usuario con sesion iniciada, o null. */
    public static UsuarioDTO usuario(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        Object u = session != null ? session.getAttribute(ATRIBUTO) : null;
        return u instanceof UsuarioDTO dto ? dto : null;
    }

    public static boolean esAdmin(HttpServletRequest req) {
        UsuarioDTO u = usuario(req);
        return u != null && u.esAdmin();
    }
}
