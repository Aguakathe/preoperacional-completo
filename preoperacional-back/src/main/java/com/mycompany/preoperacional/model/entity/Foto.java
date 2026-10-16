package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tabla fotos: imagen de una inspeccion con su categoria
 * (general, motor, llantas, frenos, luces, carroceria, interior, documentos).
 *
 * El binario va en la columna "datos" (LONGBLOB). Los listados NO lo cargan:
 * FotoDAO consulta solo los metadatos y la imagen se descarga aparte
 * con GET /api/fotos/archivo?id=X.
 */
@Entity
@Table(name = "fotos",
        indexes = @Index(name = "idx_fotos_categoria", columnList = "categoria"))
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_foto")
    private Long idFoto;

    @ManyToOne
    @JoinColumn(name = "id_mantenimiento", nullable = false, foreignKey = @ForeignKey(name = "fk_fotos_mantenimiento"))
    private Mantenimiento mantenimiento;

    @Column(name = "nombre", nullable = false, length = 255)
    private String nombre;

    /** Tipo MIME: image/jpeg, image/png o image/webp. */
    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    /** Tamano en bytes. */
    @Column(name = "tamano", nullable = false)
    private Long tamano;

    @Column(name = "categoria", nullable = false, length = 20)
    private String categoria;

    @Column(name = "creada_en", nullable = false)
    private LocalDateTime creadaEn;

    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_fotos_usuario"))
    private Usuario creadaPor;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "datos", nullable = false, length = 20_000_000)
    private byte[] datos;

    // Getters y Setters

    public Long getIdFoto() {
        return idFoto;
    }

    public void setIdFoto(Long idFoto) {
        this.idFoto = idFoto;
    }

    public Mantenimiento getMantenimiento() {
        return mantenimiento;
    }

    public void setMantenimiento(Mantenimiento mantenimiento) {
        this.mantenimiento = mantenimiento;
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

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public LocalDateTime getCreadaEn() {
        return creadaEn;
    }

    public void setCreadaEn(LocalDateTime creadaEn) {
        this.creadaEn = creadaEn;
    }

    public Usuario getCreadaPor() {
        return creadaPor;
    }

    public void setCreadaPor(Usuario creadaPor) {
        this.creadaPor = creadaPor;
    }

    public byte[] getDatos() {
        return datos;
    }

    public void setDatos(byte[] datos) {
        this.datos = datos;
    }
}
