package com.mycompany.preoperacional.util;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Permite que el front Angular (http://localhost:4200 en desarrollo) llame a
 * la API en otro puerto enviando la cookie de sesion.
 *
 * Origenes permitidos: variable de entorno CORS_ORIGINS (separados por coma).
 * Por defecto: http://localhost:4200 y http://127.0.0.1:4200.
 *
 * Nota: si el front usa el proxy de Angular (proxy.conf.json, ver README),
 * las peticiones son del mismo origen y este filtro no interviene.
 */
public class CorsFilter implements Filter {

    private Set<String> origenes;

    @Override
    public void init(FilterConfig config) {
        String valor = System.getProperty("CORS_ORIGINS", System.getenv("CORS_ORIGINS"));
        if (valor == null || valor.isBlank()) {
            valor = "http://localhost:4200,http://127.0.0.1:4200";
        }
        origenes = Arrays.stream(valor.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;

        String origen = req.getHeader("Origin");
        if (origen != null && origenes.contains(origen)) {
            resp.setHeader("Access-Control-Allow-Origin", origen);
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
            resp.addHeader("Vary", "Origin");

            if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
                resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
                resp.setHeader("Access-Control-Max-Age", "3600");
                resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
