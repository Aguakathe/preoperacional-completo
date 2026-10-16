package com.mycompany.preoperacional.dao;

import com.mycompany.preoperacional.model.entity.Rol;
import com.mycompany.preoperacional.model.entity.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.List;

public class UsuarioDAO extends GenericDAO<Usuario, Long> {

    public UsuarioDAO(EntityManager em) {
        super(em, Usuario.class);
    }

    /**
     * Solo usuarios activos (se usa en el login). No distingue mayusculas:
     * "Admin" y "admin" son el mismo usuario (igual que en el front).
     */
    public Usuario buscarPorUsername(String username) {
        return em.createQuery(
                "SELECT u FROM Usuario u WHERE LOWER(u.username) = :user AND u.estado = true",
                Usuario.class
        ).setParameter("user", username.trim().toLowerCase())
         .getResultStream()
         .findFirst()
         .orElse(null);
    }

    /** true si ya existe otro usuario con ese username (ignorando mayusculas). */
    public boolean existeUsername(String username, Long excluirId) {
        String jpql = "SELECT COUNT(u) FROM Usuario u WHERE LOWER(u.username) = :user"
                + (excluirId != null ? " AND u.idUsuario <> :id" : "");
        TypedQuery<Long> q = em.createQuery(jpql, Long.class)
                .setParameter("user", username.trim().toLowerCase());
        if (excluirId != null) {
            q.setParameter("id", excluirId);
        }
        return q.getSingleResult() > 0;
    }

    /** Todos los usuarios ordenados por username. */
    @Override
    public List<Usuario> listarTodos() {
        return em.createQuery(
                "SELECT DISTINCT u FROM Usuario u LEFT JOIN FETCH u.roles ur LEFT JOIN FETCH ur.rol "
                + "ORDER BY u.username",
                Usuario.class
        ).getResultList();
    }

    public long contarAdministradoresActivos() {
        return em.createQuery(
                "SELECT COUNT(DISTINCT u.idUsuario) FROM Usuario u JOIN u.roles ur "
                + "WHERE u.estado = true AND UPPER(ur.rol.nombre) = :admin",
                Long.class
        ).setParameter("admin", Rol.ADMIN)
         .getSingleResult();
    }
}
