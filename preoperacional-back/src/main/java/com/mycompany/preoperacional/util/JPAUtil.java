package com.mycompany.preoperacional.util;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;
import java.util.HashMap;
import java.util.Map;

/**
 * Fabrica unica de EntityManager.
 *
 * La conexion se crea en la PRIMERA peticion que la necesita (no al cargar la
 * clase). Si MySQL todavia no esta encendido, la peticion recibe 503 y la
 * siguiente lo vuelve a intentar: no hace falta reiniciar Tomcat despues de
 * prender la base de datos (tipico con XAMPP).
 *
 * Los datos de conexion salen de persistence.xml, pero se pueden cambiar SIN
 * recompilar con variables de entorno (o propiedades -D de la JVM):
 *   DB_URL, DB_USER, DB_PASSWORD
 */
public class JPAUtil {

    private static volatile EntityManagerFactory emf;

    public static EntityManager getEntityManager() {
        return fabrica().createEntityManager();
    }

    /** Libera el pool de conexiones (se llama al detener/redesplegar la app). */
    public static synchronized void close() {
        if (emf != null && emf.isOpen()) {
            emf.close();
        }
        emf = null;
    }

    private static EntityManagerFactory fabrica() {
        EntityManagerFactory actual = emf;
        if (actual != null) {
            return actual;
        }
        synchronized (JPAUtil.class) {
            if (emf == null) {
                EntityManagerFactory nueva;
                try {
                    nueva = Persistence.createEntityManagerFactory("PreoperacionalPU", overrides());
                } catch (RuntimeException e) {
                    System.err.println("[Preoperacional] No se pudo conectar a la base de datos: " + causaRaiz(e));
                    throw new BaseDatosNoDisponibleException(e);
                }
                DatosIniciales.sembrar(nueva); // roles y usuarios de prueba, una sola vez
                emf = nueva;
            }
            return emf;
        }
    }

    private static Map<String, String> overrides() {
        Map<String, String> props = new HashMap<>();
        put(props, "jakarta.persistence.jdbc.url", "DB_URL");
        put(props, "jakarta.persistence.jdbc.user", "DB_USER");
        put(props, "jakarta.persistence.jdbc.password", "DB_PASSWORD");
        return props;
    }

    private static void put(Map<String, String> props, String propiedad, String variable) {
        String valor = System.getProperty(variable, System.getenv(variable));
        if (valor != null && !valor.isBlank()) {
            props.put(propiedad, valor);
        }
    }

    private static String causaRaiz(Throwable t) {
        while (t.getCause() != null && t.getCause() != t) {
            t = t.getCause();
        }
        return t.getMessage();
    }

    /** MySQL apagado, credenciales malas, etc. Los controllers responden 503. */
    public static class BaseDatosNoDisponibleException extends RuntimeException {

        BaseDatosNoDisponibleException(Throwable causa) {
            super("No hay conexión con la base de datos. Verifique que MySQL esté encendido.", causa);
        }
    }
}
