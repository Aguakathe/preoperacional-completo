package com.mycompany.preoperacional.DTO;

import java.time.LocalDateTime;

/**
 * Metadatos de una foto (sin el binario). Mismos campos que FotoGuardada del front.
 * "url" es relativa al contexto de la app: el front le antepone la URL base
 * (ej. http://localhost:8080/preoperacional/ + url).
 */
public class FotoDTO {

    private Long id;
    private Long mantenimientoId;
    private String nombre;
    private String tipo;
    private Long tamano;
    private String categoria;
    private LocalDateTime creadaEn;
    private String creadaPor;

    /** Constructor usado por la consulta JPQL "SELECT new ..." de FotoDAO. */
    public FotoDTO(Long id, Long mantenimientoId, String nombre, String tipo, Long tamano,
            String categoria, LocalDateTime creadaEn, String creadaPor) {
        this.id = id;
        this.mantenimientoId = mantenimientoId;
        this.nombre = nombre;
        this.tipo = tipo;
        this.tamano = tamano;
        this.categoria = categoria;
        this.creadaEn = creadaEn;
        this.creadaPor = creadaPor;
    }

    public String getUrl() {
        return "api/fotos/archivo?id=" + id;
    }

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMantenimientoId() {
        return mantenimientoId;
    }

    public void setMantenimientoId(Long mantenimientoId) {
        this.mantenimientoId = mantenimientoId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Long getTamano() {
        return tamano;
    }

    public void setTamano(Long tamano) {
        this.tamano = tamano;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }

    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }

    public String getCreadaPor() {
        return creadaPor;
    }

    public void setCreadaPor(String creadaPor) {
        this.creadaPor = creadaPor;
    }
}
