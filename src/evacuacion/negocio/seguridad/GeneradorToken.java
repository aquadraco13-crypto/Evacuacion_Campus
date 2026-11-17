package evacuacion.negocio.seguridad;

import java.security.SecureRandom;
import java.util.HexFormat;

/** Crea tokens de sesión: 32 bytes aleatorios criptográficos (64 caracteres hexadecimales). */
public class GeneradorToken {

    private final SecureRandom azar = new SecureRandom();

    public String nuevo() {
        byte[] b = new byte[32];
        azar.nextBytes(b);
        return HexFormat.of().formatHex(b);
    }
}
