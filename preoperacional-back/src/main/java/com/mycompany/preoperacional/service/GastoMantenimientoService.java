package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.ArchivoDTO;
import com.mycompany.preoperacional.DTO.DocumentoDTO;
import com.mycompany.preoperacional.DTO.GastoDTO;
import com.mycompany.preoperacional.DTO.GastoRequestDTO;
import com.mycompany.preoperacional.DTO.ResumenGastosDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.dao.GastoMantenimientoDAO;
import com.mycompany.preoperacional.model.entity.DocumentoGasto;
import com.mycompany.preoperacional.model.entity.GastoMantenimiento;
import com.mycompany.preoperacional.model.entity.Usuario;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gastos de mantenimiento. Aplica las mismas validaciones del formulario del
 * front (gastos-mantenimiento.component.ts), incluida la coherencia de
 * kilometrajes, y guarda los documentos adjuntos (PDF/JPG/PNG de maximo 5 MB).
 *
 * Permisos: todos ven todos los gastos; solo el admin o quien registro el
 * gasto puede eliminarlo.
 */
public class GastoMantenimientoService {

    private static final int MAX_DOCUMENTOS = 10;
    private static final BigDecimal VALOR_MINIMO = new BigDecimal("0.01");
    private static final BigDecimal VALOR_MAXIMO = new BigDecimal("9999999999.99"); // DECIMAL(12,2)

    /** @return id del gasto creado */
    public Long crear(GastoRequestDTO req, List<ArchivoDTO> documentos, UsuarioDTO sesion) {
        if (req == null) {
            throw new IllegalArgumentException("Debe enviar los datos del gasto");
        }
        GastoMantenimiento g = new GastoMantenimiento();

        String placa = Catalogos.normalizarPlaca(req.getPlaca());
        Catalogos.validarPlaca(placa);
        g.setPlaca(placa);

        Integer km = req.getKilometraje();
        if (km == null || km < 0) {
            throw new IllegalArgumentException("El kilometraje es obligatorio y no puede ser negativo");
        }
        g.setKilometraje(km);

        if (req.getFechaGasto() == null) {
            throw new IllegalArgumentException("La fecha del gasto es obligatoria");
        }
        if (req.getFechaGasto().isAfter(Catalogos.hoy())) {
            throw new IllegalArgumentException("La fecha del gasto no puede ser futura");
        }
        g.setFechaGasto(req.getFechaGasto());

        g.setTipoGasto(deCatalogo(req.getTipoGasto(), Catalogos.TIPOS_GASTO.keySet(), "Tipo de gasto"));
        g.setDescripcion(Catalogos.requerido(req.getDescripcion(), "descripcion", 500));
        g.setProveedor(Catalogos.requerido(req.getProveedor(), "proveedor", 120));

        BigDecimal valor = req.getValorGasto();
        if (valor == null || valor.compareTo(VALOR_MINIMO) < 0) {
            throw new IllegalArgumentException("El valor del gasto debe ser mayor a 0");
        }
        if (valor.compareTo(VALOR_MAXIMO) > 0) {
            throw new IllegalArgumentException("El valor del gasto es demasiado grande");
        }
        g.setValorGasto(valor.setScale(2, RoundingMode.HALF_UP));

        g.setFormaPago(deCatalogo(req.getFormaPago(), Catalogos.FORMAS_PAGO.keySet(), "Forma de pago"));
        g.setNumeroFactura(Catalogos.maximo(Catalogos.limpio(req.getNumeroFactura()), "numeroFactura", 60));
        g.setFechaVencimiento(req.getFechaVencimiento());

        // Coherencia de kilometrajes (validador kilometrajesCoherentes del front)
        Integer anterior = req.getKilometrajeAnterior();
        if (anterior != null) {
            if (anterior < 0) {
                throw new IllegalArgumentException("El kilometraje anterior no puede ser negativo");
            }
            if (anterior > km) {
                throw new IllegalArgumentException("El kilometraje anterior no puede ser mayor al actual");
            }
        }
        g.setKilometrajeAnterior(anterior);
        Integer proximo = req.getProximoMantenimiento();
        if (proximo != null && proximo <= km) {
            throw new IllegalArgumentException("El próximo mantenimiento debe ser mayor al kilometraje actual");
        }
        g.setProximoMantenimiento(proximo);
        g.setObservaciones(Catalogos.maximo(Catalogos.limpio(req.getObservaciones()), "observaciones", 1000));

        List<ArchivoDTO> docs = documentos == null ? List.of() : documentos;
        if (docs.size() > MAX_DOCUMENTOS) {
            throw new IllegalArgumentException("Se permiten máximo " + MAX_DOCUMENTOS + " documentos por gasto");
        }
        for (ArchivoDTO a : docs) {
            g.agregarDocumento(nuevoDocumento(a));
        }

        EntityManager em = JPAUtil.getEntityManager();
        try {
            Usuario usuario = em.find(Usuario.class, sesion.getId());
            if (usuario == null) {
                throw new SecurityException("La sesión no es válida; vuelva a iniciar sesión");
            }
            g.setCreadoPor(usuario);
            g.setFechaCreacion(LocalDateTime.now());
            new GastoMantenimientoDAO(em).crear(g); // cascade guarda los documentos
            return g.getIdGasto();
        } finally {
            em.close();
        }
    }

    /** Gastos (opcionalmente de una placa), mas recientes primero. */
    public List<GastoDTO> listar(String placa) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            List<GastoMantenimiento> gastos = new GastoMantenimientoDAO(em).buscar(placaONull(placa));
            // Una sola consulta para los documentos de todos los gastos (antes era una por gasto)
            Map<Long, List<DocumentoDTO>> docs = documentosPorGasto(em, gastos.stream().map(GastoMantenimiento::getIdGasto).toList());
            return gastos.stream().map(g -> aDTO(g, docs.getOrDefault(g.getIdGasto(), List.of()))).toList();
        } finally {
            em.close();
        }
    }

    /** @return null si no existe */
    public GastoDTO detalle(Long id) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            GastoMantenimiento g = em.find(GastoMantenimiento.class, id);
            return g == null ? null : aDTO(g, documentosDTO(em, id));
        } finally {
            em.close();
        }
    }

    /** Cantidad, total y promedio (lo que el front muestra en las tarjetas de totales). */
    public ResumenGastosDTO resumen(String placa) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Object[] fila = new GastoMantenimientoDAO(em).cantidadYTotal(placaONull(placa));
            long cantidad = (Long) fila[0];
            BigDecimal total = ((BigDecimal) fila[1]).setScale(2, RoundingMode.HALF_UP);
            BigDecimal promedio = cantidad == 0 ? BigDecimal.ZERO.setScale(2)
                    : total.divide(BigDecimal.valueOf(cantidad), 2, RoundingMode.HALF_UP);
            return new ResumenGastosDTO(cantidad, total, promedio);
        } finally {
            em.close();
        }
    }

    /** Binario de un documento adjunto. @return null si no existe */
    public ArchivoDTO documento(Long idDocumento) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            DocumentoGasto d = em.find(DocumentoGasto.class, idDocumento);
            return d == null ? null : new ArchivoDTO(d.getNombre(), d.getTipo(), d.getDatos());
        } finally {
            em.close();
        }
    }

    /** Solo el admin o quien registro el gasto. @return false si no existe */
    public boolean eliminar(Long id, UsuarioDTO sesion) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            em.getTransaction().begin();
            GastoMantenimiento g = em.find(GastoMantenimiento.class, id);
            if (g == null) {
                em.getTransaction().rollback();
                return false;
            }
            if (!sesion.esAdmin() && !g.getCreadoPor().getIdUsuario().equals(sesion.getId())) {
                throw new SecurityException("Solo puedes eliminar los gastos que registraste tú");
            }
            // Borrado directo de los documentos para no cargar los binarios en memoria
            em.createQuery("DELETE FROM DocumentoGasto d WHERE d.gasto.idGasto = :id")
                    .setParameter("id", id)
                    .executeUpdate();
            em.createQuery("DELETE FROM GastoMantenimiento g WHERE g.idGasto = :id")
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

    private static DocumentoGasto nuevoDocumento(ArchivoDTO a) {
        String nombre = a.getNombre() == null || a.getNombre().isBlank() ? "documento" : a.getNombre();
        String tipo = a.getTipo() == null ? "" : a.getTipo().toLowerCase();
        if (!Catalogos.TIPOS_DOCUMENTO.contains(tipo)) {
            throw new IllegalArgumentException(nombre + " no es válido (solo PDF, JPG o PNG)");
        }
        if (a.getTamano() == 0) {
            throw new IllegalArgumentException(nombre + " está vacío");
        }
        if (a.getTamano() > Catalogos.MAX_BYTES_DOCUMENTO) {
            throw new IllegalArgumentException(nombre + " es demasiado grande (máximo 5 MB)");
        }
        DocumentoGasto d = new DocumentoGasto();
        d.setNombre(nombre.length() > 255 ? nombre.substring(nombre.length() - 255) : nombre);
        d.setTipo(tipo);
        d.setTamano(a.getTamano());
        d.setDatos(a.getDatos());
        return d;
    }

    /** Metadatos de los documentos de varios gastos agrupados por gasto, sin cargar los binarios. */
    private static Map<Long, List<DocumentoDTO>> documentosPorGasto(EntityManager em, List<Long> idsGasto) {
        Map<Long, List<DocumentoDTO>> mapa = new HashMap<>();
        if (idsGasto.isEmpty()) {
            return mapa;
        }
        em.createQuery(
                "SELECT d.gasto.idGasto, d.idDocumento, d.nombre, d.tamano, d.tipo FROM DocumentoGasto d "
                + "WHERE d.gasto.idGasto IN :ids ORDER BY d.idDocumento", Object[].class)
                .setParameter("ids", idsGasto)
                .getResultList()
                .forEach(f -> mapa.computeIfAbsent((Long) f[0], k -> new ArrayList<>())
                        .add(new DocumentoDTO((Long) f[1], (String) f[2], (Long) f[3], (String) f[4])));
        return mapa;
    }

    /** Metadatos de los documentos de un gasto, sin cargar los binarios. */
    private static List<DocumentoDTO> documentosDTO(EntityManager em, Long idGasto) {
        return em.createQuery(
                "SELECT new com.mycompany.preoperacional.DTO.DocumentoDTO(d.idDocumento, d.nombre, d.tamano, d.tipo) "
                + "FROM DocumentoGasto d WHERE d.gasto.idGasto = :id ORDER BY d.idDocumento",
                DocumentoDTO.class
        ).setParameter("id", idGasto).getResultList();
    }

    private static String deCatalogo(String valor, java.util.Set<String> permitidos, String campo) {
        String v = valor == null ? "" : valor.trim().toLowerCase();
        if (!permitidos.contains(v)) {
            throw new IllegalArgumentException(campo + " no válido. Use: " + String.join(", ", permitidos));
        }
        return v;
    }

    private static String placaONull(String placa) {
        return placa == null || placa.isBlank() ? null : Catalogos.normalizarPlaca(placa);
    }

    private static GastoDTO aDTO(GastoMantenimiento g, List<DocumentoDTO> docs) {
        GastoDTO dto = new GastoDTO();
        dto.setId(g.getIdGasto());
        dto.setPlaca(g.getPlaca());
        dto.setKilometraje(g.getKilometraje());
        dto.setFechaGasto(g.getFechaGasto());
        dto.setTipoGasto(g.getTipoGasto());
        dto.setDescripcion(g.getDescripcion());
        dto.setProveedor(g.getProveedor());
        dto.setValorGasto(g.getValorGasto());
        dto.setFormaPago(g.getFormaPago());
        dto.setNumeroFactura(g.getNumeroFactura());
        dto.setFechaVencimiento(g.getFechaVencimiento());
        dto.setKilometrajeAnterior(g.getKilometrajeAnterior());
        dto.setProximoMantenimiento(g.getProximoMantenimiento());
        dto.setObservaciones(g.getObservaciones());
        dto.setCreadoPor(g.getCreadoPor().getUsername());
        dto.setFechaCreacion(g.getFechaCreacion());
        dto.setDocumentos(docs);
        return dto;
    }
}
