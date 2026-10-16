package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.DTO.FotoDTO;
import com.mycompany.preoperacional.model.entity.Foto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Las consultas de listado usan "SELECT new FotoDTO(...)" para traer SOLO los
 * metadatos: asi nunca se cargan en memoria los binarios de todas las fotos.
 */
public class FotoDAO extends GenericDAO<Foto, Long> {

    private static final String SELECT_DTO =
            "SELECT new com.mycompany.preoperacional.DTO.FotoDTO("
            + "f.idFoto, f.mantenimiento.idMantenimiento, f.nombre, f.tipo, f.tamano, "
            + "f.categoria, f.creadaEn, f.creadaPor.username) FROM Foto f";

    public FotoDAO(EntityManager em) {
        super(em, Foto.class);
    }

    /** Fotos con filtros opcionales, de la mas reciente a la mas antigua. */
    public List<FotoDTO> buscarDTO(String categoria, Long idMantenimiento) {
        StringBuilder jpql = new StringBuilder(SELECT_DTO).append(" WHERE 1 = 1");
        if (categoria != null) jpql.append(" AND f.categoria = :categoria");
        if (idMantenimiento != null) jpql.append(" AND f.mantenimiento.idMantenimiento = :idMant");
        jpql.append(" ORDER BY f.creadaEn DESC, f.idFoto DESC");

        TypedQuery<FotoDTO> q = em.createQuery(jpql.toString(), FotoDTO.class);
        if (categoria != null) q.setParameter("categoria", categoria);
        if (idMantenimiento != null) q.setParameter("idMant", idMantenimiento);
        return q.getResultList();
    }

    public FotoDTO buscarDTOPorId(Long idFoto) {
        return em.createQuery(SELECT_DTO + " WHERE f.idFoto = :id", FotoDTO.class)
                .setParameter("id", idFoto)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    /** Ids de las fotos de cada mantenimiento (para el campo fotoIds del listado). */
    public Map<Long, List<Long>> idsPorMantenimiento() {
        Map<Long, List<Long>> mapa = new LinkedHashMap<>();
        em.createQuery(
                "SELECT f.mantenimiento.idMantenimiento, f.idFoto FROM Foto f ORDER BY f.idFoto",
                Object[].class
        ).getResultList().forEach(fila ->
                mapa.computeIfAbsent((Long) fila[0], k -> new java.util.ArrayList<>()).add((Long) fila[1]));
        return mapa;
    }

    /** Cantidad de fotos por categoria (contadores de la galeria). */
    public Map<String, Long> contarPorCategoria() {
        Map<String, Long> conteo = new LinkedHashMap<>();
        em.createQuery(
                "SELECT f.categoria, COUNT(f) FROM Foto f GROUP BY f.categoria",
                Object[].class
        ).getResultList().forEach(fila -> conteo.put((String) fila[0], (Long) fila[1]));
        return conteo;
    }
}
