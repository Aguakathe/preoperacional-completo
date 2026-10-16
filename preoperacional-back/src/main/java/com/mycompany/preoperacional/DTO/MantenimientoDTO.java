package com.mycompany.preoperacional.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Inspeccion con fotos. Mismos campos que "Mantenimiento" del front
 * (fotoIds incluido). En el detalle (GET ?id=X) tambien van las fotos.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MantenimientoDTO {

    private Long id;
    private String placa;
    private Integer kilometraje;
    private LocalDate fechaInspeccion;
    private String inspector;
    private String observaciones;
    private String creadoPor;
    private LocalDateTime creadoEn;
    private List<Long> fotoIds;
    private List<FotoDTO> fotos;

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public Integer getKilometraje() {
        return kilometraje;
    }

    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }

    public LocalDate getFechaInspeccion() {
        return fechaInspeccion;
    }

    public void setFechaInspeccion(LocalDate fechaInspeccion) {
        this.fechaInspeccion = fechaInspeccion;
    }

    public String getInspector() {
        return inspector;
    }

    public void setInspector(String inspector) {
        this.inspector = inspector;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(String creadoPor) {
        this.creadoPor = creadoPor;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(LocalDateTime creadoEn) {
        this.creadoEn = creadoEn;
    }

    public List<Long> getFotoIds() {
        return fotoIds;
    }

    public void setFotoIds(List<Long> fotoIds) {
        this.fotoIds = fotoIds;
    }

    public List<FotoDTO> getFotos() {
        return fotos;
    }

    public void setFotos(List<FotoDTO> fotos) {
        this.fotos = fotos;
    }
}
