package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;

/**
 * Tabla preoperacional_salud: cada pregunta de la certificacion de salud
 * (paso 4) con su respuesta "si" / "no".
 */
@Entity
@Table(name = "preoperacional_salud")
public class RespuestaSalud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_respuesta")
    private Long idRespuesta;

    @ManyToOne
    @JoinColumn(name = "id_preoperacional", nullable = false, foreignKey = @ForeignKey(name = "fk_salud_preoperacional"))
    private Preoperacional preoperacional;

    /** Posicion de la pregunta en el formulario (1, 2, 3...). */
    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "pregunta", nullable = false, length = 300)
    private String pregunta;

    @Column(name = "respuesta", nullable = false, length = 2)
    private String respuesta;

    // Getters y Setters

    public Long getIdRespuesta() {
        return idRespuesta;
    }

    public void setIdRespuesta(Long idRespuesta) {
        this.idRespuesta = idRespuesta;
    }

    public Preoperacional getPreoperacional() {
        return preoperacional;
    }

    public void setPreoperacional(Preoperacional preoperacional) {
        this.preoperacional = preoperacional;
    }

    public Integer getOrden() {
        return orden;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public String getPregunta() {
        return pregunta;
    }

    public void setPregunta(String pregunta) {
        this.pregunta = pregunta;
    }

    public String getRespuesta() {
        return respuesta;
    }

    public void setRespuesta(String respuesta) {
        this.respuesta = respuesta;
    }
}
