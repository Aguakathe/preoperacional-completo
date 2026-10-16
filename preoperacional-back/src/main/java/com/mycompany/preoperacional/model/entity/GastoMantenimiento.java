package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tabla gastos_mantenimiento: gasto registrado para una moto
 * (pestana "Mantenimientos > Gastos" del front).
 * Los documentos adjuntos (facturas, soportes) se borran con el gasto.
 */
@Entity
@Table(name = "gastos_mantenimiento",
        indexes = @Index(name = "idx_gastos_placa", columnList = "placa"))
public class GastoMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_gasto")
    private Long idGasto;

    @Column(name = "placa", nullable = false, length = 6)
    private String placa;

    @Column(name = "kilometraje", nullable = false)
    private Integer kilometraje;

    @Column(name = "fecha_gasto", nullable = false)
    private LocalDate fechaGasto;

    /** preventivo, correctivo, repuestos, lubricantes, neumaticos, bateria, frenos, electrico, otro. */
    @Column(name = "tipo_gasto", nullable = false, length = 20)
    private String tipoGasto;

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "proveedor", nullable = false, length = 120)
    private String proveedor;

    @Column(name = "valor_gasto", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorGasto;

    /** efectivo, tarjeta_credito, tarjeta_debito, transferencia, cheque, otro. */
    @Column(name = "forma_pago", nullable = false, length = 20)
    private String formaPago;

    @Column(name = "numero_factura", length = 60)
    private String numeroFactura;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    @Column(name = "kilometraje_anterior")
    private Integer kilometrajeAnterior;

    @Column(name = "proximo_mantenimiento")
    private Integer proximoMantenimiento;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_gastos_usuario"))
    private Usuario creadoPor;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "gasto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("idDocumento ASC")
    private List<DocumentoGasto> documentos = new ArrayList<>();

    /** Agrega un documento manteniendo la relacion en ambos lados. */
    public void agregarDocumento(DocumentoGasto doc) {
        doc.setGasto(this);
        documentos.add(doc);
    }

    // Getters y Setters

    public Long getIdGasto() {
        return idGasto;
    }

    public void setIdGasto(Long idGasto) {
        this.idGasto = idGasto;
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

    public LocalDate getFechaGasto() {
        return fechaGasto;
    }

    public void setFechaGasto(LocalDate fechaGasto) {
        this.fechaGasto = fechaGasto;
    }

    public String getTipoGasto() {
        return tipoGasto;
    }

    public void setTipoGasto(String tipoGasto) {
        this.tipoGasto = tipoGasto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getProveedor() {
        return proveedor;
    }

    public void setProveedor(String proveedor) {
        this.proveedor = proveedor;
    }

    public BigDecimal getValorGasto() {
        return valorGasto;
    }

    public void setValorGasto(BigDecimal valorGasto) {
        this.valorGasto = valorGasto;
    }

    public String getFormaPago() {
        return formaPago;
    }

    public void setFormaPago(String formaPago) {
        this.formaPago = formaPago;
    }

    public String getNumeroFactura() {
        return numeroFactura;
    }

    public void setNumeroFactura(String numeroFactura) {
        this.numeroFactura = numeroFactura;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public Integer getKilometrajeAnterior() {
        return kilometrajeAnterior;
    }

    public void setKilometrajeAnterior(Integer kilometrajeAnterior) {
        this.kilometrajeAnterior = kilometrajeAnterior;
    }

    public Integer getProximoMantenimiento() {
        return proximoMantenimiento;
    }

    public void setProximoMantenimiento(Integer proximoMantenimiento) {
        this.proximoMantenimiento = proximoMantenimiento;
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

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public List<DocumentoGasto> getDocumentos() {
        return documentos;
    }

    public void setDocumentos(List<DocumentoGasto> documentos) {
        this.documentos = documentos;
    }
}
