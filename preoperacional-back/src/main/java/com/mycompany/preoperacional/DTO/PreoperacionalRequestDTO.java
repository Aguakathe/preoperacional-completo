package com.mycompany.preoperacional.DTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Cuerpo de POST /api/preoperacionales. Es EXACTAMENTE el objeto que arma el front en
 * PreoperacionalComponent.construirEnvio() (tipo PreoperacionalNuevo en models/preoperacional.ts).
 * La fecha de envio la pone el servidor.
 *
 * {
 *   "conoceCampana": "si",
 *   "qlid": "AB123456", "nombreCompleto": "...", "placaMoto": "ABC12G", "kilometraje": 15400,
 *   "documentacionVigente": "buen_estado", "estadoGeneralVehiculo": "buen_estado",
 *   "estadoSistemasAccesorios": "mal_estado",
 *   "saludItems": [ {"pregunta": "...", "respuesta": "si"}, ... ],
 *   "elementosMalEstado": "si",
 *   "elementosNoCumplen": {
 *      "documentacion":  {"perfectoEstado": true,  "elementos": []},
 *      "estadoSistemas": {"perfectoEstado": false, "elementos": ["Bocina"]}, ...
 *   },
 *   "confirmaciones": null
 * }
 */
public class PreoperacionalRequestDTO {

    private String conoceCampana;
    private String qlid;
    private String nombreCompleto;
    private String placaMoto;
    private Integer kilometraje;
    private String documentacionVigente;
    private String estadoGeneralVehiculo;
    private String estadoSistemasAccesorios;
    private List<SaludItemDTO> saludItems = new ArrayList<>();
    private String elementosMalEstado;
    /** Clave: documentacion | estadoGeneral | estadoMecanico | estadoSistemas. */
    private Map<String, CategoriaNoCumpleDTO> elementosNoCumplen;
    private ConfirmacionesDTO confirmaciones;

    // getters y setters

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

    public List<SaludItemDTO> getSaludItems() {
        return saludItems;
    }

    public void setSaludItems(List<SaludItemDTO> saludItems) {
        this.saludItems = saludItems;
    }

    public String getElementosMalEstado() {
        return elementosMalEstado;
    }

    public void setElementosMalEstado(String elementosMalEstado) {
        this.elementosMalEstado = elementosMalEstado;
    }

    public Map<String, CategoriaNoCumpleDTO> getElementosNoCumplen() {
        return elementosNoCumplen;
    }

    public void setElementosNoCumplen(Map<String, CategoriaNoCumpleDTO> elementosNoCumplen) {
        this.elementosNoCumplen = elementosNoCumplen;
    }

    public ConfirmacionesDTO getConfirmaciones() {
        return confirmaciones;
    }

    public void setConfirmaciones(ConfirmacionesDTO confirmaciones) {
        this.confirmaciones = confirmaciones;
    }
}
