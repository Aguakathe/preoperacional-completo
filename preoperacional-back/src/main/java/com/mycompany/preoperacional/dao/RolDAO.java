package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.model.entity.Rol;
import jakarta.persistence.EntityManager;

public class RolDAO extends GenericDAO<Rol, Long> {

    public RolDAO(EntityManager em) {
        super(em, Rol.class);
    }

    /** Busca por nombre (ADMIN / USUARIO) sin distinguir mayusculas. */
    public Rol buscarPorNombre(String nombre) {
        return em.createQuery(
                "SELECT r FROM Rol r WHERE UPPER(r.nombre) = :n", Rol.class)
                .setParameter("n", nombre.toUpperCase())
                .getResultStream()
                .findFirst()
                .orElse(null);
    }
}
