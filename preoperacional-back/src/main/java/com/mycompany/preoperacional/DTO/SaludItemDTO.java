package com.mycompany.preoperacional.DTO;

/**
 * Pregunta de la certificacion de salud (paso 4) con su respuesta "si" / "no".
 */
public class SaludItemDTO {

    private String pregunta;
    private String respuesta;

    // getters y setters

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
