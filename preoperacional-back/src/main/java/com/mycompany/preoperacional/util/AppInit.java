package com.mycompany.preoperacional.util;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**
 * Se ejecuta al desplegar la app: intenta conectarse a la base de datos para
 * que Hibernate cree las tablas y DatosIniciales cree los roles y usuarios de
 * prueba (admin / 12345, usuario / 123456).
 *
 * Si MySQL aun no esta encendido NO pasa nada grave: se avisa en consola y la
 * conexion se vuelve a intentar en la primera peticion a la API.
 */
@WebListener
public class AppInit implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            JPAUtil.getEntityManager().close();
        } catch (JPAUtil.BaseDatosNoDisponibleException e) {
            System.err.println("[Preoperacional] La base de datos no esta disponible todavia. "
                    + "Se reintentara en la primera peticion a la API.");
        } catch (Throwable t) {
            System.err.println("[Preoperacional] ERROR al inicializar la base de datos:");
            t.printStackTrace();
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        try {
            JPAUtil.close();
        } catch (Throwable ignored) {
            // si el EMF nunca llego a crearse no hay nada que cerrar
        }
    }
}
