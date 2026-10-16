package com.mycompany.preoperacional.DTO;

/**
 * Documento adjunto de un gasto (sin el binario). Mismos campos que
 * DocumentoGuardado del front (name, size, type) mas id y url de descarga.
 */
public class DocumentoDTO {

    private Long id;
    private String name;
    private Long size;
    private String type;

    public DocumentoDTO(Long id, String name, Long size, String type) {
        this.id = id;
        this.name = name;
        this.size = size;
        this.type = type;
    }

    public String getUrl() {
        return "api/gastos/documento?id=" + id;
    }

    // getters y setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
