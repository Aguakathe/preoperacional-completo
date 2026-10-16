package com.mycompany.preoperacional.DTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Gasto para mostrar en pantalla: mismos campos que GastoRegistrado del front
 * (id, placa, kilometraje, ..., documentos, fechaCreacion) mas creadoPor.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GastoDTO extends GastoRequestDTO {

    private Long id;
    private String creadoPor;
    private LocalDateTime fechaCreacion;
    private List<DocumentoDTO> documentos;

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCreadoPor() {
        return creadoPor;
    }

    public void setCreadoPor(String creadoPor) {
        this.creadoPor = creadoPor;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public List<DocumentoDTO> getDocumentos() {
        return documentos;
    }

    public void setDocumentos(List<DocumentoDTO> documentos) {
        this.documentos = documentos;
    }
}
