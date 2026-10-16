package com.mycompany.preoperacional.model.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tabla preoperacionales: inspeccion diaria que el conductor diligencia antes
 * de usar la moto (formulario "Preoperacional" del front, pasos 1 a 7).
 *
 * Las respuestas de salud (paso 4) y los elementos que no cumplen (paso 6)
 * viven en tablas hijas y se borran junto con el preoperacional.
 */
@Entity
@Table(name = "preoperacionales",
        indexes = @Index(name = "idx_preoperacionales_placa", columnList = "placa_moto"))
public class Preoperacional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_preoperacional")
    private Long idPreoperacional;

    /** Usuario que tenia la sesion iniciada al enviar el formulario. */
    @ManyToOne
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_preoperacionales_usuario"))
    private Usuario usuario;

    @Column(name = "fecha_envio", nullable = false)
    private LocalDateTime fechaEnvio;

    // ---- 1) Campana de prevencion ----
    @Column(name = "conoce_campana", nullable = false, length = 2)
    private String conoceCampana;

    // ---- 2) Datos del conductor y de la moto ----
    @Column(name = "qlid", nullable = false, length = 30)
    private String qlid;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(name = "placa_moto", nullable = false, length = 6)
    private String placaMoto;

    @Column(name = "kilometraje", nullable = false)
    private Integer kilometraje;

    // ---- 3) Estado del vehiculo: buen_estado | mal_estado ----
    @Column(name = "documentacion_vigente", nullable = false, length = 12)
    private String documentacionVigente;

    @Column(name = "estado_general_vehiculo", nullable = false, length = 12)
    private String estadoGeneralVehiculo;

    @Column(name = "estado_sistemas_accesorios", nullable = false, length = 12)
    private String estadoSistemasAccesorios;

    // ---- 5) ¿Hay elementos en mal estado? si | no ----
    @Column(name = "elementos_mal_estado", nullable = false, length = 2)
    private String elementosMalEstado;

    // ---- 6) "Perfecto estado" por categoria (solo si elementos_mal_estado = si) ----
    @Column(name = "documentacion_perfecta")
    private Boolean documentacionPerfecta;

    @Column(name = "estado_general_perfecto")
    private Boolean estadoGeneralPerfecto;

    @Column(name = "estado_mecanico_perfecto")
    private Boolean estadoMecanicoPerfecto;

    @Column(name = "estado_sistemas_perfecto")
    private Boolean estadoSistemasPerfecto;

    // ---- 7) Confirmaciones (solo si elementos_mal_estado = no) ----
    @Column(name = "confirmacion_insegura", length = 2)
    private String confirmacionInsegura;

    @Column(name = "confirmacion_inspeccion", length = 2)
    private String confirmacionInspeccion;

    /** false si alguna respuesta de salud fue "no": el conductor NO debe conducir. */
    @Column(name = "apto_para_conducir", nullable = false)
    private Boolean aptoParaConducir;

    @OneToMany(mappedBy = "preoperacional", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<RespuestaSalud> respuestasSalud = new ArrayList<>();

    @OneToMany(mappedBy = "preoperacional", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("idElemento ASC")
    private List<ElementoNoCumple> elementosNoCumplen = new ArrayList<>();

    /** Agrega una respuesta de salud manteniendo la relacion en ambos lados. */
    public void agregarRespuestaSalud(RespuestaSalud r) {
        r.setPreoperacional(this);
        respuestasSalud.add(r);
    }

    /** Agrega un elemento que no cumple manteniendo la relacion en ambos lados. */
    public void agregarElementoNoCumple(ElementoNoCumple e) {
        e.setPreoperacional(this);
        elementosNoCumplen.add(e);
    }

    /** Valor de "perfecto estado" de una categoria del paso 6 (clave del front). */
    public Boolean getPerfecto(String categoria) {
        return switch (categoria) {
            case "documentacion" -> documentacionPerfecta;
            case "estadoGeneral" -> estadoGeneralPerfecto;
            case "estadoMecanico" -> estadoMecanicoPerfecto;
            case "estadoSistemas" -> estadoSistemasPerfecto;
            default -> null;
        };
    }

    public void setPerfecto(String categoria, Boolean valor) {
        switch (categoria) {
            case "documentacion" -> documentacionPerfecta = valor;
            case "estadoGeneral" -> estadoGeneralPerfecto = valor;
            case "estadoMecanico" -> estadoMecanicoPerfecto = valor;
            case "estadoSistemas" -> estadoSistemasPerfecto = valor;
            default -> throw new IllegalArgumentException("Categoría desconocida: " + categoria);
        }
    }

    // Getters y Setters

    public Long getIdPreoperacional() {
        return idPreoperacional;
    }

    public void setIdPreoperacional(Long idPreoperacional) {
        this.idPreoperacional = idPreoperacional;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public String getConoceCampana() {
        return conoceCampana;
    }

    public void setConoceCampana(String conoceCampana) {
        this.conoceCampana = conoceCampana;
    }

    public String getQlid() {
        return qlid;
    }

    public void setQlid(String qlid) {
        this.qlid = qlid;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getPlacaMoto() {
        return placaMoto;
    }

    public void setPlacaMoto(String placaMoto) {
        this.placaMoto = placaMoto;
    }

    public Integer getKilometraje() {
        return kilometraje;
    }

    public void setKilometraje(Integer kilometraje) {
        this.kilometraje = kilometraje;
    }

    public String getDocumentacionVigente() {
        return documentacionVigente;
    }

    public void setDocumentacionVigente(String documentacionVigente) {
        this.documentacionVigente = documentacionVigente;
    }

    public String getEstadoGeneralVehiculo() {
        return estadoGeneralVehiculo;
    }

    public void setEstadoGeneralVehiculo(String estadoGeneralVehiculo) {
        this.estadoGeneralVehiculo = estadoGeneralVehiculo;
    }

    public String getEstadoSistemasAccesorios() {
        return estadoSistemasAccesorios;
    }

    public void setEstadoSistemasAccesorios(String estadoSistemasAccesorios) {
        this.estadoSistemasAccesorios = estadoSistemasAccesorios;
    }

    public String getElementosMalEstado() {
        return elementosMalEstado;
    }

    public void setElementosMalEstado(String elementosMalEstado) {
        this.elementosMalEstado = elementosMalEstado;
    }

    public Boolean getDocumentacionPerfecta() {
        return documentacionPerfecta;
    }

    public void setDocumentacionPerfecta(Boolean documentacionPerfecta) {
        this.documentacionPerfecta = documentacionPerfecta;
    }

    public Boolean getEstadoGeneralPerfecto() {
        return estadoGeneralPerfecto;
    }

    public void setEstadoGeneralPerfecto(Boolean estadoGeneralPerfecto) {
        this.estadoGeneralPerfecto = estadoGeneralPerfecto;
    }

    public Boolean getEstadoMecanicoPerfecto() {
        return estadoMecanicoPerfecto;
    }

    public void setEstadoMecanicoPerfecto(Boolean estadoMecanicoPerfecto) {
        this.estadoMecanicoPerfecto = estadoMecanicoPerfecto;
    }

    public Boolean getEstadoSistemasPerfecto() {
        return estadoSistemasPerfecto;
    }

    public void setEstadoSistemasPerfecto(Boolean estadoSistemasPerfecto) {
        this.estadoSistemasPerfecto = estadoSistemasPerfecto;
    }

    public String getConfirmacionInsegura() {
        return confirmacionInsegura;
    }

    public void setConfirmacionInsegura(String confirmacionInsegura) {
        this.confirmacionInsegura = confirmacionInsegura;
    }

    public String getConfirmacionInspeccion() {
        return confirmacionInspeccion;
    }

    public void setConfirmacionInspeccion(String confirmacionInspeccion) {
        this.confirmacionInspeccion = confirmacionInspeccion;
    }

    public Boolean getAptoParaConducir() {
        return aptoParaConducir;
    }

    public void setAptoParaConducir(Boolean aptoParaConducir) {
        this.aptoParaConducir = aptoParaConducir;
    }

    public List<RespuestaSalud> getRespuestasSalud() {
        return respuestasSalud;
    }

    public void setRespuestasSalud(List<RespuestaSalud> respuestasSalud) {
        this.respuestasSalud = respuestasSalud;
    }

    public List<ElementoNoCumple> getElementosNoCumplen() {
        return elementosNoCumplen;
    }

    public void setElementosNoCumplen(List<ElementoNoCumple> elementosNoCumplen) {
        this.elementosNoCumplen = elementosNoCumplen;
    }
}
