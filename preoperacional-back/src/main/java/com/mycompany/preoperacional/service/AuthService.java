package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.CambioPasswordDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.dao.UsuarioDAO;
import com.mycompany.preoperacional.model.entity.Usuario;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import com.mycompany.preoperacional.util.PasswordUtil;
import jakarta.persistence.EntityManager;

/** Inicio de sesion y cambio de contrasena. */
public class AuthService {

    /** @return el usuario de la sesion, o null si las credenciales no son validas. */
    public UsuarioDTO login(String username, String passwordPlano) {
        if (username == null || username.isBlank() || passwordPlano == null) {
            return null;
        }
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Usuario usuario = new UsuarioDAO(em).buscarPorUsername(username);
            if (usuario == null || !Boolean.TRUE.equals(usuario.getEstado())) {
                return null;
            }
            if (!PasswordUtil.verificar(passwordPlano, usuario.getPasswordHash())) {
                return null;
            }
            return aDTO(usuario);
        } finally {
            em.close();
        }
    }

    /**
     * Cambia la contrasena verificando la actual.
     *
     * @param sesion usuario con sesion iniciada; si es null se usa cambio.username
     *               (cambio desde la pantalla de login, igual que el front)
     */
    public void cambiarPassword(UsuarioDTO sesion, CambioPasswordDTO cambio) {
        if (cambio == null || cambio.getPasswordActual() == null || cambio.getPasswordNueva() == null) {
            throw new IllegalArgumentException("Debe indicar la contraseña actual y la nueva");
        }
        String nueva = cambio.getPasswordNueva();
        if (nueva.length() < Catalogos.PASSWORD_MIN) {
            throw new IllegalArgumentException(
                    "La nueva contraseña debe tener mínimo " + Catalogos.PASSWORD_MIN + " caracteres");
        }
        if (nueva.equals(cambio.getPasswordActual())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser distinta a la actual");
        }

        EntityManager em = JPAUtil.getEntityManager();
        try {
            UsuarioDAO dao = new UsuarioDAO(em);
            Usuario usuario;
            String errorCredenciales;
            if (sesion != null) {
                usuario = em.find(Usuario.class, sesion.getId());
                errorCredenciales = "La contraseña actual es incorrecta";
            } else {
                if (cambio.getUsername() == null || cambio.getUsername().isBlank()) {
                    throw new IllegalArgumentException("Debe indicar el usuario");
                }
                usuario = dao.buscarPorUsername(cambio.getUsername());
                // No se revela si fallo el usuario o la contrasena
                errorCredenciales = "Usuario o contraseña actual incorrectos";
            }
            if (usuario == null || !PasswordUtil.verificar(cambio.getPasswordActual(), usuario.getPasswordHash())) {
                throw new SecurityException(errorCredenciales);
            }
            usuario.setPasswordHash(PasswordUtil.cifrar(nueva));
            dao.actualizar(usuario);
        } finally {
            em.close();
        }
    }

    static UsuarioDTO aDTO(Usuario u) {
        return new UsuarioDTO(u.getIdUsuario(), u.getUsername(), u.getNombre(), u.getRolPrincipal());
    }
}
