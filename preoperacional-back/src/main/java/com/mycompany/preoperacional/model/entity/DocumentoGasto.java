package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;

/**
 * Tabla documentos_gasto: factura o soporte adjunto a un gasto (PDF, JPG o PNG).
 * El binario se descarga con GET /api/gastos/documento?id=X.
 */
@Entity
@Table(name = "documentos_gasto")
public class DocumentoGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Long idDocumento;

    @ManyToOne
    @JoinColumn(name = "id_gasto", nullable = false, foreignKey = @ForeignKey(name = "fk_documentos_gasto"))
    private GastoMantenimiento gasto;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "tamano", nullable = false)
    private Long tamano;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "datos", nullable = false, length = 20_000_000)
    private byte[] datos;

    // Getters y Setters

    public Long getIdDocumento() {
        return idDocumento;
    }

    public void setIdDocumento(Long idDocumento) {
        this.idDocumento = idDocumento;
    }

    public GastoMantenimiento getGasto() {
        return gasto;
    }

    public void setGasto(GastoMantenimiento gasto) {
        this.gasto = gasto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Long getTamano() {
        return tamano;
    }

    public void setTamano(Long tamano) {
        this.tamano = tamano;
    }

    public byte[] getDatos() {
        return datos;
    }

    public void setDatos(byte[] datos) {
        this.datos = datos;
    }
}
