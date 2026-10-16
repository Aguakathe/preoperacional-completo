package com.mycompany.preoperacional.DTO;

/**
 * PUT /api/fotos: reasigna la categoria de una foto.
 */
public class CambioCategoriaDTO {

    private Long idFoto;
    private String categoria;

    // getters y setters

    public Long getIdFoto() {
        return idFoto;
    }

    public void setIdFoto(Long idFoto) {
        this.idFoto = idFoto;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
}
