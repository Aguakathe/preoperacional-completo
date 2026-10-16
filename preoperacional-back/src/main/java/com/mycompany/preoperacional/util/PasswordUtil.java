package com.mycompany.preoperacional.util;

import org.mindrot.jbcrypt.BCrypt;

/** Cifrado de contrasenas con BCrypt (nunca se guardan en texto plano). */
public class PasswordUtil {

    public static String cifrar(String passwordPlano) {
        return BCrypt.hashpw(passwordPlano, BCrypt.gensalt());
    }

    public static boolean verificar(String passwordPlano, String hash) {
        if (passwordPlano == null || hash == null) {
            return false;
        }
        return BCrypt.checkpw(passwordPlano, hash);
    }
}
