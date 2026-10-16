package com.mycompany.preoperacional.DTO;

/**
 * Paso 7 (solo cuando no hay elementos en mal estado): respuestas "si" / "no".
 */
public class ConfirmacionesDTO {

    private String confirmacionInsegura;
    private String confirmacionInspeccion;

    // getters y setters

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
}
