package com.mycompany.preoperacional.DTO;

import java.math.BigDecimal;

/** Totales de GET /api/gastos?resumen=1 (lo que el front muestra como total y promedio). */
public class ResumenGastosDTO {

    private long cantidad;
    private BigDecimal total;
    private BigDecimal promedio;

    public ResumenGastosDTO(long cantidad, BigDecimal total, BigDecimal promedio) {
        this.cantidad = cantidad;
        this.total = total;
        this.promedio = promedio;
    }

    // getters y setters

    public long getCantidad() {
        return cantidad;
    }

    public void setCantidad(long cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public BigDecimal getPromedio() {
        return promedio;
    }

    public void setPromedio(BigDecimal promedio) {
        this.promedio = promedio;
    }
}
