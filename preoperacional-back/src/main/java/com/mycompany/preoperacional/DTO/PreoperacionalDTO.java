package com.mycompany.preoperacional.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

/**
 * Preoperacional para mostrar en pantalla. Tiene los mismos campos que envia
 * el front mas los que pone el servidor (id, fecha, quien lo registro, apto).
 * En el listado solo van los datos del encabezado; en el detalle
 * (GET ?id=X) tambien van saludItems, elementosNoCumplen y confirmaciones.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PreoperacionalDTO extends PreoperacionalRequestDTO {

    private Long id;
    private LocalDateTime fechaEnvio;
    private String registradoPor;
    private Boolean aptoParaConducir;
    /** Cantidad de elementos reportados como "no cumple" (paso 6). */
    private Integer totalNoCumplen;

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }

    public Boolean getAptoParaConducir() {
        return aptoParaConducir;
    }

    public void setAptoParaConducir(Boolean aptoParaConducir) {
        this.aptoParaConducir = aptoParaConducir;
    }

    public Integer getTotalNoCumplen() {
        return totalNoCumplen;
    }

    public void setTotalNoCumplen(Integer totalNoCumplen) {
        this.totalNoCumplen = totalNoCumplen;
    }
}
