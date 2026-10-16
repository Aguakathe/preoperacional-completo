package com.mycompany.preoperacional.util;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;

/**
 * Protege /api/*: sin sesion iniciada responde 401 (el front lo detecta y
 * redirige al login).
 *
 * Quedan libres:
 *  - /api/login y /api/logout
 *  - /api/password  (el front permite cambiar la contrasena desde la pantalla
 *                    de login, verificando usuario + contrasena actual)
 *  - las peticiones OPTIONS (preflight CORS)
 *
 * Se registra en web.xml (despues de CorsFilter).
 */
public class AuthFilter implements Filter {

    private static final Set<String> LIBRES = Set.of("/api/login", "/api/logout", "/api/password");

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || LIBRES.contains(req.getServletPath())) {
            chain.doFilter(request, response);
            return;
        }

        if (SesionUtil.usuario(req) == null) {
            JsonUtil.error(resp, HttpServletResponse.SC_UNAUTHORIZED,
                    "Debe iniciar sesión (POST /api/login)");
            return;
        }

        chain.doFilter(request, response);
    }
}
