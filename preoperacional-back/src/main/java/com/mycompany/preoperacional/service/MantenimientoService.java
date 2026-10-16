package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.DTO.MantenimientoDTO;
import com.mycompany.preoperacional.DTO.MantenimientoRequestDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.dao.FotoDAO;
import com.mycompany.preoperacional.dao.MantenimientoDAO;
import com.mycompany.preoperacional.model.entity.Foto;
import com.mycompany.preoperacional.model.entity.Mantenimiento;
import com.mycompany.preoperacional.model.entity.Usuario;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Inspecciones con fotos de estado (equivale a FotosService.guardarInspeccion
 * del front). La inspeccion y todas sus fotos se guardan en UNA transaccion:
 * si una foto no es valida no se guarda nada.
 */
public class MantenimientoService {

    /** @return id del mantenimiento creado */
    public Long crear(MantenimientoRequestDTO req, List<ArchivoDTO> fotos, UsuarioDTO sesion) {
        if (req == null) {
            throw new IllegalArgumentException("Debe enviar los datos de la inspección (parte \"datos\")");
        }
        Mantenimiento m = new Mantenimiento();
        String placa = Catalogos.normalizarPlaca(req.getPlaca());
        Catalogos.validarPlaca(placa);
        m.setPlaca(placa);
        if (req.getKilometraje() == null || req.getKilometraje() < 0) {
            throw new IllegalArgumentException("El kilometraje es obligatorio y no puede ser negativo");
        }
        m.setKilometraje(req.getKilometraje());
        if (req.getFechaInspeccion() == null) {
            throw new IllegalArgumentException("Selecciona la fecha de inspección");
        }
        if (req.getFechaInspeccion().isAfter(Catalogos.hoy())) {
            throw new IllegalArgumentException("La fecha de inspección no puede ser futura");
        }
        m.setFechaInspeccion(req.getFechaInspeccion());
        m.setInspector(Catalogos.requerido(req.getInspector(), "inspector", 120));
        m.setObservaciones(Catalogos.maximo(Catalogos.limpio(req.getObservaciones()), "observaciones", 1000));

        if (fotos == null || fotos.isEmpty()) {
            throw new IllegalArgumentException("Sube al menos una foto del estado de la moto");
        }
        if (fotos.size() > Catalogos.MAX_FOTOS) {
            throw new IllegalArgumentException("Solo se permiten " + Catalogos.MAX_FOTOS + " fotos por inspección");
        }
        List<String> categorias = req.getCategorias() == null ? List.of() : req.getCategorias();
        if (categorias.size() > fotos.size()) {
            throw new IllegalArgumentException("Llegaron más categorías (" + categorias.size()
                    + ") que fotos (" + fotos.size() + ")");
        }

        LocalDateTime ahora = LocalDateTime.now();
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Usuario usuario = em.find(Usuario.class, sesion.getId());
            if (usuario == null) {
                throw new SecurityException("La sesión no es válida; vuelva a iniciar sesión");
            }
            m.setCreadoPor(usuario);
            m.setCreadoEn(ahora);
            for (int i = 0; i < fotos.size(); i++) {
                String categoria = i < categorias.size() ? categorias.get(i) : null;
                m.agregarFoto(nuevaFoto(fotos.get(i), categoria, usuario, ahora));
            }
            new MantenimientoDAO(em).crear(m); // cascade guarda las fotos
            return m.getIdMantenimiento();
        } finally {
            em.close();
        }
    }

    /** Inspecciones (opcionalmente de una placa) con los ids de sus fotos. */
    public List<MantenimientoDTO> listar(String placa) {
        String placaNorm = placa == null || placa.isBlank() ? null : Catalogos.normalizarPlaca(placa);
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Map<Long, List<Long>> ids = new FotoDAO(em).idsPorMantenimiento();
            return new MantenimientoDAO(em).buscar(placaNorm).stream().map(m -> {
                MantenimientoDTO dto = resumen(m);
                dto.setFotoIds(ids.getOrDefault(m.getIdMantenimiento(), List.of()));
                return dto;
            }).toList();
        } finally {
            em.close();
        }
    }

    /** Inspeccion con los metadatos de sus fotos. @return null si no existe */
    public MantenimientoDTO detalle(Long id) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Mantenimiento m = new MantenimientoDAO(em).buscarPorId(id);
            if (m == null) {
                return null;
            }
            MantenimientoDTO dto = resumen(m);
            dto.setFotos(new FotoDAO(em).buscarDTO(null, id));
            dto.setFotoIds(dto.getFotos().stream().map(f -> f.getId()).toList());
            return dto;
        } finally {
            em.close();
        }
    }

    /**
     * Borra la inspeccion con todas sus fotos. Solo el admin o quien la creo.
     *
     * @return false si no existe
     */
    public boolean eliminar(Long id, UsuarioDTO sesion) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            em.getTransaction().begin();
            Mantenimiento m = em.find(Mantenimiento.class, id);
            if (m == null) {
                em.getTransaction().rollback();
                return false;
            }
            if (!sesion.esAdmin() && !m.getCreadoPor().getIdUsuario().equals(sesion.getId())) {
                throw new SecurityException("Solo puedes eliminar las inspecciones que registraste tú");
            }
            // Borrado directo de las fotos para no cargar todos los binarios en memoria
            em.createQuery("DELETE FROM Foto f WHERE f.mantenimiento.idMantenimiento = :id")
                    .setParameter("id", id)
                    .executeUpdate();
            em.createQuery("DELETE FROM Mantenimiento m WHERE m.idMantenimiento = :id")
                    .setParameter("id", id)
                    .executeUpdate();
            em.getTransaction().commit();
            return true;
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

    /** Valida tipo y tamano igual que el front (JPG, PNG o WEBP de maximo 10 MB). */
    static Foto nuevaFoto(ArchivoDTO archivo, String categoria, Usuario usuario, LocalDateTime ahora) {
        String nombre = archivo.getNombre() == null || archivo.getNombre().isBlank() ? "foto" : archivo.getNombre();
        String tipo = archivo.getTipo() == null ? "" : archivo.getTipo().toLowerCase();
        if (!Catalogos.TIPOS_FOTO.contains(tipo)) {
            throw new IllegalArgumentException(nombre + " no es una imagen válida (solo JPG, PNG o WEBP)");
        }
        if (archivo.getTamano() == 0) {
            throw new IllegalArgumentException(nombre + " está vacío");
        }
        if (archivo.getTamano() > Catalogos.MAX_BYTES_FOTO) {
            throw new IllegalArgumentException(nombre + " es demasiado grande (máximo 10 MB)");
        }
        String cat = categoria == null || categoria.isBlank()
                ? Catalogos.CATEGORIA_FOTO_POR_DEFECTO : categoria.trim().toLowerCase();
        if (!Catalogos.CATEGORIAS_FOTO.containsKey(cat)) {
            throw new IllegalArgumentException("Categoría de foto no válida: " + categoria);
        }

        Foto f = new Foto();
        f.setNombre(nombre.length() > 255 ? nombre.substring(nombre.length() - 255) : nombre);
        f.setTipo(tipo);
        f.setTamano(archivo.getTamano());
        f.setCategoria(cat);
        f.setCreadaEn(ahora);
        f.setCreadaPor(usuario);
        f.setDatos(archivo.getDatos());
        return f;
    }

    private static MantenimientoDTO resumen(Mantenimiento m) {
        MantenimientoDTO dto = new MantenimientoDTO();
        dto.setId(m.getIdMantenimiento());
        dto.setPlaca(m.getPlaca());
        dto.setKilometraje(m.getKilometraje());
        dto.setFechaInspeccion(m.getFechaInspeccion());
        dto.setInspector(m.getInspector());
        dto.setObservaciones(m.getObservaciones());
        dto.setCreadoPor(m.getCreadoPor().getUsername());
        dto.setCreadoEn(m.getCreadoEn());
        return dto;
    }
}
