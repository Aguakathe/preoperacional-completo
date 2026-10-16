package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tabla mantenimientos: inspeccion de una moto con sus fotos de estado
 * (pestana "Mantenimientos > Fotos de estado" del front).
 * Las fotos se borran junto con el mantenimiento.
 */
@Entity
@Table(name = "mantenimientos",
        indexes = @Index(name = "idx_mantenimientos_placa", columnList = "placa"))
public class Mantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mantenimiento")
    private Long idMantenimiento;

    @Column(name = "placa", nullable = false, length = 6)
    private String placa;

    @Column(name = "kilometraje", nullable = false)
    private Integer kilometraje;

    @Column(name = "fecha_inspeccion", nullable = false)
    private LocalDate fechaInspeccion;

    @Column(name = "inspector", nullable = false, length = 120)
    private String inspector;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_mantenimientos_usuario"))
    private Usuario creadoPor;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @OneToMany(mappedBy = "mantenimiento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("idFoto ASC")
    private List<Foto> fotos = new ArrayList<>();

    /** Agrega una foto manteniendo la relacion en ambos lados. */
    public void agregarFoto(Foto foto) {
        foto.setMantenimiento(this);
        fotos.add(foto);
    }

    // Getters y Setters

    public Long getIdMantenimiento() {
        return idMantenimiento;
    }

    public void setIdMantenimiento(Long idMantenimiento) {
        this.idMantenimiento = idMantenimiento;
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

    public Usuario getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(Usuario creadoPor) {
        this.creadoPor = creadoPor;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(LocalDateTime creadoEn) {
        this.creadoEn = creadoEn;
    }

    public List<Foto> getFotos() {
        return fotos;
    }

    public void setFotos(List<Foto> fotos) {
        this.fotos = fotos;
    }
}
