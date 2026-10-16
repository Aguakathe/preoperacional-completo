package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.UsuarioListadoDTO;
import com.mycompany.preoperacional.DTO.UsuarioRequestDTO;
import com.mycompany.preoperacional.dao.RolDAO;
import com.mycompany.preoperacional.dao.UsuarioDAO;
import com.mycompany.preoperacional.model.entity.Rol;
import com.mycompany.preoperacional.model.entity.Usuario;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import com.mycompany.preoperacional.util.PasswordUtil;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Administracion de usuarios (solo admin; el controller lo verifica).
 * Equivale a "Crear Usuario" del front, mas listar y activar/desactivar.
 */
public class UsuarioService {

    public List<UsuarioListadoDTO> listar() {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            return new UsuarioDAO(em).listarTodos().stream().map(UsuarioService::aListado).toList();
        } finally {
            em.close();
        }
    }

    /** Crea un usuario. Por defecto con rol "usuario" (igual que el front). */
    public UsuarioListadoDTO crear(UsuarioRequestDTO req) {
        if (req == null) {
            throw new IllegalArgumentException("Debe enviar los datos del usuario");
        }
        String username = Catalogos.requerido(req.getUsername(), "username", 60);
        if (!username.matches("[A-Za-z0-9._-]+")) {
            throw new IllegalArgumentException("El usuario solo puede tener letras, números, punto, guion y guion bajo");
        }
        String password = req.getPassword();
        if (password == null || password.length() < Catalogos.PASSWORD_MIN) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener mínimo " + Catalogos.PASSWORD_MIN + " caracteres");
        }

        EntityManager em = JPAUtil.getEntityManager();
        try {
            UsuarioDAO dao = new UsuarioDAO(em);
            if (dao.existeUsername(username, null)) {
                throw new IllegalStateException("El usuario ya existe");
            }
            Usuario u = new Usuario();
            u.setUsername(username);
            u.setPasswordHash(PasswordUtil.cifrar(password));
            u.setNombre(Catalogos.maximo(Catalogos.limpio(req.getNombre()), "nombre", 120));
            u.setEmail(Catalogos.maximo(Catalogos.limpio(req.getEmail()), "email", 120));
            u.setEstado(req.getEstado() == null || req.getEstado());
            u.setFechaCreacion(LocalDateTime.now());
            u.asignarRol(rol(em, req.getRol() == null ? "usuario" : req.getRol()));
            dao.crear(u);
            return aListado(u);
        } finally {
            em.close();
        }
    }

    /**
     * Actualiza nombre, email, rol y/o estado (activo/inactivo); si viene
     * "password" la restablece. No deja el sistema sin administradores activos.
     *
     * @return null si el usuario no existe
     */
    public UsuarioListadoDTO actualizar(UsuarioRequestDTO req, Long idAdminActual) {
        if (req == null || req.getIdUsuario() == null) {
            throw new IllegalArgumentException("Debe proporcionar el idUsuario");
        }
        EntityManager em = JPAUtil.getEntityManager();
        try {
            UsuarioDAO dao = new UsuarioDAO(em);
            Usuario u = dao.buscarPorId(req.getIdUsuario());
            if (u == null) {
                return null;
            }
            boolean eraAdminActivo = u.tieneRol(Rol.ADMIN) && Boolean.TRUE.equals(u.getEstado());

            em.getTransaction().begin();
            if (req.getNombre() != null) {
                u.setNombre(Catalogos.maximo(Catalogos.limpio(req.getNombre()), "nombre", 120));
            }
            if (req.getEmail() != null) {
                u.setEmail(Catalogos.maximo(Catalogos.limpio(req.getEmail()), "email", 120));
            }
            if (req.getEstado() != null) {
                if (!req.getEstado() && u.getIdUsuario().equals(idAdminActual)) {
                    throw new IllegalStateException("No puede desactivar su propio usuario");
                }
                u.setEstado(req.getEstado());
            }
            if (req.getRol() != null) {
                Rol nuevo = rol(em, req.getRol());
                if (!u.tieneRol(nuevo.getNombre())) {
                    u.getRoles().clear();
                    em.flush(); // borra las filas usuario_rol antes de insertar la nueva
                    u.asignarRol(nuevo);
                }
            }
            if (req.getPassword() != null) {
                if (req.getPassword().length() < Catalogos.PASSWORD_MIN) {
                    throw new IllegalArgumentException(
                            "La contraseña debe tener mínimo " + Catalogos.PASSWORD_MIN + " caracteres");
                }
                u.setPasswordHash(PasswordUtil.cifrar(req.getPassword()));
            }
            em.flush();

            boolean sigueAdminActivo = u.tieneRol(Rol.ADMIN) && Boolean.TRUE.equals(u.getEstado());
            if (eraAdminActivo && !sigueAdminActivo && dao.contarAdministradoresActivos() == 0) {
                throw new IllegalStateException("Debe quedar al menos un administrador activo");
            }
            em.getTransaction().commit();
            return aListado(u);
        } catch (RuntimeException e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw e;
        } finally {
            em.close();
        }
    }

    // ---------- auxiliares ----------

    private static Rol rol(EntityManager em, String rolFront) {
        String nombre = switch (rolFront.trim().toLowerCase()) {
            case "admin" -> Rol.ADMIN;
            case "usuario" -> Rol.USUARIO;
            default -> throw new IllegalArgumentException("Rol no válido. Use \"admin\" o \"usuario\"");
        };
        Rol rol = new RolDAO(em).buscarPorNombre(nombre);
        if (rol == null) {
            throw new IllegalStateException("El rol " + nombre + " no existe en la base de datos");
        }
        return rol;
    }

    private static UsuarioListadoDTO aListado(Usuario u) {
        return new UsuarioListadoDTO(u.getIdUsuario(), u.getUsername(), u.getNombre(), u.getEmail(),
                u.getRolPrincipal(), u.getEstado(), u.getFechaCreacion());
    }
}
