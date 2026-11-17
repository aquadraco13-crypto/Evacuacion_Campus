package evacuacion.negocio.seguridad;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Compara una clave con la verdadera usando SHA-256 y MessageDigest.isEqual (tiempo constante). */
public class VerificadorClave {

    private final byte[] hash;

    public VerificadorClave(String clave) {
        this.hash = sha256(clave);
    }

    public boolean coincide(String intento) {
        return intento != null && MessageDigest.isEqual(hash, sha256(intento));
    }

    private static byte[] sha256(String s) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
