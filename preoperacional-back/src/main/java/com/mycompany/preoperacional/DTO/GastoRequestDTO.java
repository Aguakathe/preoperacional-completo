package com.mycompany.preoperacional.DTO;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Datos de un gasto en POST /api/gastos (JSON, o parte "datos" del multipart).
 * Mismos nombres de campo que el formulario del front.
 */
public class GastoRequestDTO {

    private String placa;
    private Integer kilometraje;
    private LocalDate fechaGasto;
    private String tipoGasto;
    private String descripcion;
    private String proveedor;
    private BigDecimal valorGasto;
    private String formaPago;
    private String numeroFactura;
    private LocalDate fechaVencimiento;
    private Integer kilometrajeAnterior;
    private Integer proximoMantenimiento;
    private String observaciones;

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
}
