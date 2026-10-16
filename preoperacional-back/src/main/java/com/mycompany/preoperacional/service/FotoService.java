package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.DTO.FotoDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.dao.FotoDAO;
import com.mycompany.preoperacional.model.entity.Foto;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import jakarta.persistence.EntityManager;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Galeria de fotos: listado por categoria, contadores, descarga del binario,
 * cambio de categoria y borrado.
 *
 * Permisos (igual que FotosService.puedeEditar del front): todos ven todas las
 * fotos; solo el admin o quien subio la foto puede moverla o eliminarla.
 */
public class FotoService {

    public List<FotoDTO> listar(String categoria, Long idMantenimiento) {
        String cat = categoria == null || categoria.isBlank() ? null : categoria.trim().toLowerCase();
        if (cat != null && !Catalogos.CATEGORIAS_FOTO.containsKey(cat)) {
            throw new IllegalArgumentException("Categoría no válida. Use: "
                    + String.join(", ", Catalogos.CATEGORIAS_FOTO.keySet()));
        }
        EntityManager em = JPAUtil.getEntityManager();
        try {
            return new FotoDAO(em).buscarDTO(cat, idMantenimiento);
        } finally {
            em.close();
        }
    }

    /** Cantidad de fotos por categoria, con las 8 categorias siempre presentes (en 0 si no hay). */
    public Map<String, Long> conteo() {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Map<String, Long> db = new FotoDAO(em).contarPorCategoria();
            Map<String, Long> conteo = new LinkedHashMap<>();
            Catalogos.CATEGORIAS_FOTO.keySet().forEach(c -> conteo.put(c, db.getOrDefault(c, 0L)));
            return conteo;
        } finally {
            em.close();
        }
    }

    /** Binario de la foto. @return null si no existe */
    public ArchivoDTO archivo(Long idFoto) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Foto f = em.find(Foto.class, idFoto);
            return f == null ? null : new ArchivoDTO(f.getNombre(), f.getTipo(), f.getDatos());
        } finally {
            em.close();
        }
    }

    /** Reasigna la categoria. @return la foto actualizada o null si no existe */
    public FotoDTO cambiarCategoria(Long idFoto, String categoria, UsuarioDTO sesion) {
        if (idFoto == null) {
            throw new IllegalArgumentException("Debe indicar idFoto");
        }
        String cat = categoria == null ? "" : categoria.trim().toLowerCase();
        if (!Catalogos.CATEGORIAS_FOTO.containsKey(cat)) {
            throw new IllegalArgumentException("Categoría no válida. Use: "
                    + String.join(", ", Catalogos.CATEGORIAS_FOTO.keySet()));
        }
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Long duenio = duenio(em, idFoto);
            if (duenio == null) {
                return null;
            }
            verificarPermiso(duenio, sesion, "Solo puedes mover las fotos que subiste tú");
            ejecutar(em, "UPDATE Foto f SET f.categoria = :cat WHERE f.idFoto = :id", idFoto, cat);
            return new FotoDAO(em).buscarDTOPorId(idFoto);
        } finally {
            em.close();
        }
    }

    /** @return false si no existe */
    public boolean eliminar(Long idFoto, UsuarioDTO sesion) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Long duenio = duenio(em, idFoto);
            if (duenio == null) {
                return false;
            }
            verificarPermiso(duenio, sesion, "Solo puedes eliminar las fotos que subiste tú");
            ejecutar(em, "DELETE FROM Foto f WHERE f.idFoto = :id", idFoto, null);
            return true;
        } finally {
            em.close();
        }
    }

    // ---------- auxiliares ----------

    /** Id del usuario que subio la foto, sin cargar el binario. null si no existe. */
    private static Long duenio(EntityManager em, Long idFoto) {
        return em.createQuery("SELECT f.creadaPor.idUsuario FROM Foto f WHERE f.idFoto = :id", Long.class)
                .setParameter("id", idFoto)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }

    private static void verificarPermiso(Long idDuenio, UsuarioDTO sesion, String mensaje) {
        if (!sesion.esAdmin() && !idDuenio.equals(sesion.getId())) {
            throw new SecurityException(mensaje);
        }
    }

    private static void ejecutar(EntityManager em, String jpql, Long id, String categoria) {
        try {
            em.getTransaction().begin();
            var q = em.createQuery(jpql).setParameter("id", id);
            if (categoria != null) {
                q.setParameter("cat", categoria);
            }
            q.executeUpdate();
            em.getTransaction().commit();
        } catch (RuntimeException e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw e;
        }
    }
}
