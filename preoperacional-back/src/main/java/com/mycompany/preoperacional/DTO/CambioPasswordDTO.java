package com.mycompany.preoperacional.DTO;

/**
 * PUT /api/password. Con sesion iniciada basta passwordActual y passwordNueva;
 * desde la pantalla de login (sin sesion) tambien se envia username.
 */
public class CambioPasswordDTO {

    private String username;
    private String passwordActual;
    private String passwordNueva;

    // getters y setters

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordActual() {
        return passwordActual;
    }

    public void setPasswordActual(String passwordActual) {
        this.passwordActual = passwordActual;
    }

    public String getPasswordNueva() {
        return passwordNueva;
    }

    public void setPasswordNueva(String passwordNueva) {
        this.passwordNueva = passwordNueva;
    }
}
