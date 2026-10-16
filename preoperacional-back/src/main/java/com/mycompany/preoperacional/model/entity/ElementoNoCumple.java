package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;

/**
 * Tabla preoperacional_elementos: elementos reportados como "no cumple" en el
 * paso 6, por categoria (documentacion, estadoGeneral, estadoMecanico, estadoSistemas).
 */
@Entity
@Table(name = "preoperacional_elementos")
public class ElementoNoCumple {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_elemento")
    private Long idElemento;

    @ManyToOne
    @JoinColumn(name = "id_preoperacional", nullable = false, foreignKey = @ForeignKey(name = "fk_elementos_preoperacional"))
    private Preoperacional preoperacional;

    @Column(name = "categoria", nullable = false, length = 20)
    private String categoria;

    @Column(name = "elemento", nullable = false, length = 120)
    private String elemento;

    // Getters y Setters

    public Long getIdElemento() {
        return idElemento;
    }

    public void setIdElemento(Long idElemento) {
        this.idElemento = idElemento;
    }

    public Preoperacional getPreoperacional() {
        return preoperacional;
    }

    public void setPreoperacional(Preoperacional preoperacional) {
        this.preoperacional = preoperacional;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getElemento() {
        return elemento;
    }

    public void setElemento(String elemento) {
        this.elemento = elemento;
    }
}
