package com.mycompany.preoperacional.util;

import com.mycompany.preoperacional.model.entity.Rol;
import com.mycompany.preoperacional.model.entity.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.time.LocalDateTime;

/**
 * Crea los roles ADMIN y USUARIO y, si la tabla de usuarios esta vacia, los
 * usuarios de prueba (los mismos del front):
 *
 *   admin   / 12345    (rol admin)
 *   usuario / 123456   (rol usuario)
 *
 * JPAUtil lo ejecuta una vez, justo despues de conectarse a la base de datos.
 * Cambia las contrasenas despues del primer ingreso (PUT /api/password).
 */
final class DatosIniciales {

    private DatosIniciales() {
    }

    static void sembrar(EntityManagerFactory emf) {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();

            Rol admin = buscarOCrearRol(em, Rol.ADMIN, "Administrador del sistema");
            Rol usuario = buscarOCrearRol(em, Rol.USUARIO, "Conductor / usuario operativo");

            Long total = em.createQuery("SELECT COUNT(u) FROM Usuario u", Long.class).getSingleResult();
            if (total == 0) {
                crearUsuario(em, "admin", "12345", "Administrador", admin);
                crearUsuario(em, "usuario", "123456", "Usuario de prueba", usuario);
                System.out.println("[Preoperacional] Usuarios iniciales creados: admin / 12345 y usuario / 123456");
            }

            em.getTransaction().commit();
            System.out.println("[Preoperacional] Base de datos lista.");
        } catch (RuntimeException e) {
            // No impide usar la app: solo faltarian los datos iniciales
            System.err.println("[Preoperacional] ERROR al crear los datos iniciales:");
            e.printStackTrace();
            if (em.getTransaction().isActive()) em.getTransaction().rollback();
        } finally {
            em.close();
        }
    }

    private static Rol buscarOCrearRol(EntityManager em, String nombre, String descripcion) {
        return em.createQuery("SELECT r FROM Rol r WHERE r.nombre = :n", Rol.class)
                .setParameter("n", nombre)
                .getResultStream()
                .findFirst()
                .orElseGet(() -> {
                    Rol r = new Rol();
                    r.setNombre(nombre);
                    r.setDescripcion(descripcion);
                    em.persist(r);
                    return r;
                });
    }

    private static void crearUsuario(EntityManager em, String username, String password, String nombre, Rol rol) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setPasswordHash(PasswordUtil.cifrar(password));
        u.setNombre(nombre);
        u.setEstado(true);
        u.setFechaCreacion(LocalDateTime.now());
        u.asignarRol(rol);
        em.persist(u); // cascade guarda usuario_rol
    }
}
