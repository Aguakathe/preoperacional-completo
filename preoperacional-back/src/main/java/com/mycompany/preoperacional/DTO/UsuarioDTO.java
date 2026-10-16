package com.mycompany.preoperacional.DTO;

import java.io.Serializable;

/**
 * Usuario de la sesion. Es lo que devuelve POST/GET /api/login y lo que se
 * guarda en la HttpSession (nunca la entidad ni la contrasena).
 *
 * El front usa "username" como nombreUsuario y "rol" ("admin" | "usuario").
 */
public class UsuarioDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String nombre;
    private String rol;

    public UsuarioDTO() {
    }

    public UsuarioDTO(Long id, String username, String nombre, String rol) {
        this.id = id;
        this.username = username;
        this.nombre = nombre;
        this.rol = rol;
    }

    /** true si el rol es "admin" (no se serializa: no es un getter). */
    public boolean esAdmin() {
        return "admin".equals(rol);
    }

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
