package com.mycompany.preoperacional.DTO;

import java.time.LocalDateTime;

/** Fila del listado de usuarios (GET /api/usuarios, solo admin). Sin contrasenas. */
public class UsuarioListadoDTO {

    private Long id;
    private String username;
    private String nombre;
    private String email;
    private String rol;
    private Boolean estado;
    private LocalDateTime fechaCreacion;

    public UsuarioListadoDTO(Long id, String username, String nombre, String email,
            String rol, Boolean estado, LocalDateTime fechaCreacion) {
        this.id = id;
        this.username = username;
        this.nombre = nombre;
        this.email = email;
        this.rol = rol;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}
