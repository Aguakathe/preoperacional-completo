package com.mycompany.preoperacional.service;

import com.mycompany.preoperacional.DTO.CategoriaNoCumpleDTO;
import com.mycompany.preoperacional.DTO.ConfirmacionesDTO;
import com.mycompany.preoperacional.DTO.PreoperacionalDTO;
import com.mycompany.preoperacional.DTO.PreoperacionalRequestDTO;
import com.mycompany.preoperacional.DTO.SaludItemDTO;
import com.mycompany.preoperacional.DTO.UsuarioDTO;
import com.mycompany.preoperacional.dao.PreoperacionalDAO;
import com.mycompany.preoperacional.model.entity.ElementoNoCumple;
import com.mycompany.preoperacional.model.entity.Preoperacional;
import com.mycompany.preoperacional.model.entity.RespuestaSalud;
import com.mycompany.preoperacional.model.entity.Usuario;
import com.mycompany.preoperacional.util.Catalogos;
import com.mycompany.preoperacional.util.JPAUtil;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Logica de negocio del formulario preoperacional. Aplica en el servidor las
 * MISMAS reglas que el front (preoperacional.component.ts → pendientes()):
 *  - todas las respuestas obligatorias y con valores validos;
 *  - coherencia: si en el paso 3 hay "mal estado", el paso 5 no puede ser "no";
 *  - si hay elementos en mal estado, cada categoria del paso 6 debe quedar
 *    resuelta ("perfecto estado" o elementos marcados) y reportar al menos uno;
 *  - si no los hay, las dos confirmaciones del paso 7 son obligatorias.
 * Ademas calcula aptoParaConducir (ninguna respuesta de salud en "no").
 *
 * Permisos: el usuario ve solo sus preoperacionales; el admin ve todos y es
 * el unico que puede eliminarlos.
 */
public class PreoperacionalService {

    private static final Set<String> SI_NO = Set.of(Catalogos.SI, Catalogos.NO);
    private static final Set<String> ESTADOS = Set.of(Catalogos.BUEN_ESTADO, Catalogos.MAL_ESTADO);

    /** @return id del preoperacional creado */
    public Long crear(PreoperacionalRequestDTO req, UsuarioDTO sesion) {
        if (req == null) {
            throw new IllegalArgumentException("Debe enviar el formulario");
        }

        Preoperacional p = new Preoperacional();
        // 1) Campana
        p.setConoceCampana(opcion(req.getConoceCampana(), SI_NO,
                "1) Responde si conoces la campaña de prevención"));
        // 2) Datos
        p.setQlid(Catalogos.requerido(req.getQlid(), "qlid", 30));
        p.setNombreCompleto(Catalogos.requerido(req.getNombreCompleto(), "nombreCompleto", 120));
        String placa = Catalogos.normalizarPlaca(req.getPlacaMoto());
        Catalogos.validarPlaca(placa);
        p.setPlacaMoto(placa);
        if (req.getKilometraje() == null || req.getKilometraje() < 0) {
            throw new IllegalArgumentException("2) El kilometraje es obligatorio y no puede ser negativo");
        }
        p.setKilometraje(req.getKilometraje());
        // 3) Estado del vehiculo
        String msg3 = "3) Indica el estado de documentación, estado general y sistemas (buen_estado o mal_estado)";
        p.setDocumentacionVigente(opcion(req.getDocumentacionVigente(), ESTADOS, msg3));
        p.setEstadoGeneralVehiculo(opcion(req.getEstadoGeneralVehiculo(), ESTADOS, msg3));
        p.setEstadoSistemasAccesorios(opcion(req.getEstadoSistemasAccesorios(), ESTADOS, msg3));
        boolean hayMalEstadoEnChequeos = Catalogos.MAL_ESTADO.equals(p.getDocumentacionVigente())
                || Catalogos.MAL_ESTADO.equals(p.getEstadoGeneralVehiculo())
                || Catalogos.MAL_ESTADO.equals(p.getEstadoSistemasAccesorios());

        // 4) Salud
        List<SaludItemDTO> salud = req.getSaludItems() == null ? List.of() : req.getSaludItems();
        if (salud.size() != Catalogos.PREGUNTAS_SALUD.size()) {
            throw new IllegalArgumentException("4) Responde todas las preguntas de salud ("
                    + Catalogos.PREGUNTAS_SALUD.size() + " preguntas)");
        }
        boolean apto = true;
        for (int i = 0; i < salud.size(); i++) {
            SaludItemDTO item = salud.get(i);
            RespuestaSalud r = new RespuestaSalud();
            r.setOrden(i + 1);
            String pregunta = item == null ? null : Catalogos.limpio(item.getPregunta());
            r.setPregunta(Catalogos.maximo(pregunta != null ? pregunta : Catalogos.PREGUNTAS_SALUD.get(i),
                    "pregunta", 300));
            r.setRespuesta(opcion(item == null ? null : item.getRespuesta(), SI_NO,
                    "4) Responde todas las preguntas de salud (si / no)"));
            if (Catalogos.NO.equals(r.getRespuesta())) {
                apto = false;
            }
            p.agregarRespuestaSalud(r);
        }
        p.setAptoParaConducir(apto);

        // 5) Elementos en mal estado
        p.setElementosMalEstado(opcion(req.getElementosMalEstado(), SI_NO,
                "5) Indica si hay elementos en mal estado"));

        if (Catalogos.NO.equals(p.getElementosMalEstado())) {
            if (hayMalEstadoEnChequeos) {
                throw new IllegalArgumentException(
                        "5) Marcaste «Mal estado» en el punto 3: indica que hay elementos que no cumplen");
            }
            // 7) Confirmaciones
            ConfirmacionesDTO c = req.getConfirmaciones();
            String msg7 = "7) Responde las dos confirmaciones (si / no)";
            if (c == null) {
                throw new IllegalArgumentException(msg7);
            }
            p.setConfirmacionInsegura(opcion(c.getConfirmacionInsegura(), SI_NO, msg7));
            p.setConfirmacionInspeccion(opcion(c.getConfirmacionInspeccion(), SI_NO, msg7));
        } else {
            // 6) Detalle por categoria
            agregarElementosNoCumplen(p, req.getElementosNoCumplen());
        }

        EntityManager em = JPAUtil.getEntityManager();
        try {
            Usuario usuario = em.find(Usuario.class, sesion.getId());
            if (usuario == null) {
                throw new SecurityException("La sesión no es válida; vuelva a iniciar sesión");
            }
            p.setUsuario(usuario);
            p.setFechaEnvio(LocalDateTime.now());
            new PreoperacionalDAO(em).crear(p); // cascade guarda salud y elementos
            return p.getIdPreoperacional();
        } finally {
            em.close();
        }
    }

    /** Listado con filtros opcionales. Un usuario normal solo ve los suyos. */
    public List<PreoperacionalDTO> listar(UsuarioDTO sesion, String placa, LocalDate desde, LocalDate hasta) {
        Long idUsuario = sesion.esAdmin() ? null : sesion.getId();
        String placaNorm = placa == null || placa.isBlank() ? null : Catalogos.normalizarPlaca(placa);
        EntityManager em = JPAUtil.getEntityManager();
        try {
            return new PreoperacionalDAO(em).buscar(idUsuario, placaNorm, desde, hasta)
                    .stream().map(PreoperacionalService::resumen).toList();
        } finally {
            em.close();
        }
    }

    /** Detalle completo. @return null si no existe */
    public PreoperacionalDTO detalle(Long id, UsuarioDTO sesion) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            Preoperacional p = em.find(Preoperacional.class, id);
            if (p == null) {
                return null;
            }
            if (!sesion.esAdmin() && !p.getUsuario().getIdUsuario().equals(sesion.getId())) {
                throw new SecurityException("Solo puedes consultar tus propios preoperacionales");
            }
            PreoperacionalDTO dto = resumen(p);
            dto.setSaludItems(p.getRespuestasSalud().stream().map(r -> {
                SaludItemDTO s = new SaludItemDTO();
                s.setPregunta(r.getPregunta());
                s.setRespuesta(r.getRespuesta());
                return s;
            }).toList());

            if (Catalogos.SI.equals(p.getElementosMalEstado())) {
                Map<String, CategoriaNoCumpleDTO> mapa = new LinkedHashMap<>();
                for (String categoria : Catalogos.CATEGORIAS_PREOPERACIONAL.keySet()) {
                    CategoriaNoCumpleDTO c = new CategoriaNoCumpleDTO();
                    c.setPerfectoEstado(Boolean.TRUE.equals(p.getPerfecto(categoria)));
                    c.setElementos(p.getElementosNoCumplen().stream()
                            .filter(e -> e.getCategoria().equals(categoria))
                            .map(ElementoNoCumple::getElemento)
                            .toList());
                    mapa.put(categoria, c);
                }
                dto.setElementosNoCumplen(mapa);
            } else {
                ConfirmacionesDTO c = new ConfirmacionesDTO();
                c.setConfirmacionInsegura(p.getConfirmacionInsegura());
                c.setConfirmacionInspeccion(p.getConfirmacionInspeccion());
                dto.setConfirmaciones(c);
            }
            return dto;
        } finally {
            em.close();
        }
    }

    /** Solo admin (lo verifica el controller). @return false si no existe */
    public boolean eliminar(Long id) {
        EntityManager em = JPAUtil.getEntityManager();
        try {
            PreoperacionalDAO dao = new PreoperacionalDAO(em);
            if (dao.buscarPorId(id) == null) {
                return false;
            }
            dao.eliminar(id);
            return true;
        } finally {
            em.close();
        }
    }

    // ---------- auxiliares ----------

    private static void agregarElementosNoCumplen(Preoperacional p, Map<String, CategoriaNoCumpleDTO> datos) {
        String msg6 = "6) En cada categoría marca «perfecto estado» o los elementos que no cumplen";
        if (datos == null) {
            throw new IllegalArgumentException(msg6);
        }
        for (String clave : datos.keySet()) {
            if (!Catalogos.CATEGORIAS_PREOPERACIONAL.containsKey(clave)) {
                throw new IllegalArgumentException("6) Categoría desconocida: " + clave);
            }
        }
        int total = 0;
        for (Map.Entry<String, List<String>> cat : Catalogos.CATEGORIAS_PREOPERACIONAL.entrySet()) {
            CategoriaNoCumpleDTO c = datos.get(cat.getKey());
            if (c == null) {
                throw new IllegalArgumentException(msg6);
            }
            boolean perfecto = Boolean.TRUE.equals(c.getPerfectoEstado());
            // Sin duplicados y conservando el orden en que llegaron
            Set<String> elementos = new LinkedHashSet<>(c.getElementos() == null ? List.of() : c.getElementos());
            if (perfecto && !elementos.isEmpty()) {
                throw new IllegalArgumentException("6) «" + cat.getKey()
                        + "» no puede estar en perfecto estado y a la vez tener elementos que no cumplen");
            }
            if (!perfecto && elementos.isEmpty()) {
                throw new IllegalArgumentException(msg6);
            }
            for (String elemento : elementos) {
                if (!cat.getValue().contains(elemento)) {
                    throw new IllegalArgumentException("6) «" + elemento + "» no pertenece a la categoría " + cat.getKey());
                }
                ElementoNoCumple e = new ElementoNoCumple();
                e.setCategoria(cat.getKey());
                e.setElemento(elemento);
                p.agregarElementoNoCumple(e);
            }
            p.setPerfecto(cat.getKey(), perfecto);
            total += elementos.size();
        }
        if (total == 0) {
            throw new IllegalArgumentException("6) Reporta al menos un elemento que no cumple");
        }
    }

    /** Normaliza (minusculas, sin espacios) y valida contra los valores permitidos. */
    private static String opcion(String valor, Set<String> permitidos, String mensaje) {
        String v = valor == null ? "" : valor.trim().toLowerCase();
        if (!permitidos.contains(v)) {
            throw new IllegalArgumentException(mensaje);
        }
        return v;
    }

    private static PreoperacionalDTO resumen(Preoperacional p) {
        PreoperacionalDTO dto = new PreoperacionalDTO();
        dto.setId(p.getIdPreoperacional());
        dto.setFechaEnvio(p.getFechaEnvio());
        dto.setRegistradoPor(p.getUsuario().getUsername());
        dto.setConoceCampana(p.getConoceCampana());
        dto.setQlid(p.getQlid());
        dto.setNombreCompleto(p.getNombreCompleto());
        dto.setPlacaMoto(p.getPlacaMoto());
        dto.setKilometraje(p.getKilometraje());
        dto.setDocumentacionVigente(p.getDocumentacionVigente());
        dto.setEstadoGeneralVehiculo(p.getEstadoGeneralVehiculo());
        dto.setEstadoSistemasAccesorios(p.getEstadoSistemasAccesorios());
        dto.setElementosMalEstado(p.getElementosMalEstado());
        dto.setAptoParaConducir(p.getAptoParaConducir());
        dto.setTotalNoCumplen(p.getElementosNoCumplen().size());
        dto.setSaludItems(null); // en el listado no van los detalles
        return dto;
    }
}
