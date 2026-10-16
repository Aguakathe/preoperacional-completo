package com.mycompany.preoperacional.DTO;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Datos de la inspeccion en POST /api/mantenimientos (parte "datos" del multipart).
 * categorias: categoria de cada foto, en el MISMO orden en que se envian los archivos
 * (si falta, la foto queda en "general").
 */
public class MantenimientoRequestDTO {

    private String placa;
    private Integer kilometraje;
    private LocalDate fechaInspeccion;
    private String inspector;
    private String observaciones;
    private List<String> categorias = new ArrayList<>();

    // getters y setters

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

    public List<String> getCategorias() {
        return categorias;
    }

    public void setCategorias(List<String> categorias) {
        this.categorias = categorias;
    }
}
