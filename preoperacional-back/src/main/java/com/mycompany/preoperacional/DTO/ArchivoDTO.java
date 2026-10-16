package com.mycompany.preoperacional.DTO;

/**
 * Archivo en memoria: lo que llega en un multipart (foto o documento) y lo
 * que se devuelve al descargarlo.
 */
public class ArchivoDTO {

    private String nombre;
    private String tipo;
    private byte[] datos;

    public ArchivoDTO(String nombre, String tipo, byte[] datos) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.datos = datos;
    }

    public long getTamano() {
        return datos == null ? 0 : datos.length;
    }

    // getters y setters

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

    public byte[] getDatos() {
        return datos;
    }

    public void setDatos(byte[] datos) {
        this.datos = datos;
    }
}
