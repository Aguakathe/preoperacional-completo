package com.mycompany.preoperacional.DTO;

import java.util.ArrayList;
import java.util.List;

/**
 * Paso 6, una categoria: perfectoEstado=true o la lista de elementos que no cumplen.
 */
public class CategoriaNoCumpleDTO {

    private Boolean perfectoEstado;
    private List<String> elementos = new ArrayList<>();

    // getters y setters

    public Boolean getPerfectoEstado() {
        return perfectoEstado;
    }

    public void setPerfectoEstado(Boolean perfectoEstado) {
        this.perfectoEstado = perfectoEstado;
    }

    public List<String> getElementos() {
        return elementos;
    }

    public void setElementos(List<String> elementos) {
        this.elementos = elementos;
    }
}
