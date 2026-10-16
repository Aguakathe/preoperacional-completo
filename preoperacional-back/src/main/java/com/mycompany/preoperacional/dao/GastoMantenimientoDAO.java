package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.model.entity.GastoMantenimiento;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.util.List;

public class GastoMantenimientoDAO extends GenericDAO<GastoMantenimiento, Long> {

    public GastoMantenimientoDAO(EntityManager em) {
        super(em, GastoMantenimiento.class);
    }

    /** Gastos (opcionalmente de una placa), del mas reciente al mas antiguo. */
    public List<GastoMantenimiento> buscar(String placa) {
        String jpql = "SELECT g FROM GastoMantenimiento g JOIN FETCH g.creadoPor"
                + (placa != null ? " WHERE g.placa = :placa" : "")
                + " ORDER BY g.fechaCreacion DESC, g.idGasto DESC";
        TypedQuery<GastoMantenimiento> q = em.createQuery(jpql, GastoMantenimiento.class);
        if (placa != null) {
            q.setParameter("placa", placa);
        }
        return q.getResultList();
    }

    /** [cantidad, suma] de los gastos (opcionalmente de una placa). */
    public Object[] cantidadYTotal(String placa) {
        String jpql = "SELECT COUNT(g), COALESCE(SUM(g.valorGasto), 0) FROM GastoMantenimiento g"
                + (placa != null ? " WHERE g.placa = :placa" : "");
        TypedQuery<Object[]> q = em.createQuery(jpql, Object[].class);
        if (placa != null) {
            q.setParameter("placa", placa);
        }
        Object[] fila = q.getSingleResult();
        long cantidad = ((Number) fila[0]).longValue();
        BigDecimal total = fila[1] instanceof BigDecimal b ? b : new BigDecimal(fila[1].toString());
        return new Object[]{cantidad, total};
    }
}
