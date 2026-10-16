package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.model.entity.Mantenimiento;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.List;

public class MantenimientoDAO extends GenericDAO<Mantenimiento, Long> {

    public MantenimientoDAO(EntityManager em) {
        super(em, Mantenimiento.class);
    }

    /** Inspecciones (opcionalmente de una placa), de la mas reciente a la mas antigua. */
    public List<Mantenimiento> buscar(String placa) {
        String jpql = "SELECT m FROM Mantenimiento m JOIN FETCH m.creadoPor"
                + (placa != null ? " WHERE m.placa = :placa" : "")
                + " ORDER BY m.creadoEn DESC, m.idMantenimiento DESC";
        TypedQuery<Mantenimiento> q = em.createQuery(jpql, Mantenimiento.class);
        if (placa != null) {
            q.setParameter("placa", placa);
        }
        return q.getResultList();
    }
}
