package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.model.entity.Preoperacional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDate;
import java.util.List;

public class PreoperacionalDAO extends GenericDAO<Preoperacional, Long> {

    public PreoperacionalDAO(EntityManager em) {
        super(em, Preoperacional.class);
    }

    /**
     * Busqueda con filtros opcionales (cualquiera puede ser null), del mas
     * reciente al mas antiguo.
     *
     * @param idUsuario solo los registrados por ese usuario (null = todos)
     * @param placa     placa exacta
     * @param desde     fecha de envio desde (inclusive)
     * @param hasta     fecha de envio hasta (inclusive)
     */
    public List<Preoperacional> buscar(Long idUsuario, String placa, LocalDate desde, LocalDate hasta) {
        StringBuilder jpql = new StringBuilder(
                "SELECT DISTINCT p FROM Preoperacional p JOIN FETCH p.usuario "
                + "LEFT JOIN FETCH p.elementosNoCumplen WHERE 1 = 1");
        if (idUsuario != null) jpql.append(" AND p.usuario.idUsuario = :idUsuario");
        if (placa != null) jpql.append(" AND p.placaMoto = :placa");
        if (desde != null) jpql.append(" AND p.fechaEnvio >= :desde");
        if (hasta != null) jpql.append(" AND p.fechaEnvio < :hasta");
        jpql.append(" ORDER BY p.fechaEnvio DESC, p.idPreoperacional DESC");

        TypedQuery<Preoperacional> q = em.createQuery(jpql.toString(), Preoperacional.class);
        if (idUsuario != null) q.setParameter("idUsuario", idUsuario);
        if (placa != null) q.setParameter("placa", placa);
        if (desde != null) q.setParameter("desde", desde.atStartOfDay());
        if (hasta != null) q.setParameter("hasta", hasta.plusDays(1).atStartOfDay());
        return q.getResultList();
    }

    /** Ultimo preoperacional de una placa (util para validar kilometraje). */
    public Preoperacional ultimoPorPlaca(String placa) {
        return em.createQuery(
                "SELECT p FROM Preoperacional p WHERE p.placaMoto = :placa "
                + "ORDER BY p.fechaEnvio DESC, p.idPreoperacional DESC",
                Preoperacional.class
        ).setParameter("placa", placa)
         .setMaxResults(1)
         .getResultStream()
         .findFirst()
         .orElse(null);
    }
}
