package evacuacion.negocio.seguridad;

import evacuacion.datos.clave.ProveedorClave;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

/**
 * Decide la clave de administrador: prueba las fuentes en orden y, si ninguna da una clave válida
 * (mínimo 8 caracteres), inventa una al azar. Sumar una fuente nueva es agregarla a la lista (SOLID O).
 */
public class ResolutorClave {

    public static final int LARGO_MINIMO = 8;
    // Sin 0/O/1/l/I para que sea fácil de copiar
    private static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    /** La clave elegida y un mensaje para la consola (nunca incluye la clave configurada). */
    public record Resultado(String clave, List<String> mensajes) { }

    private final List<ProveedorClave> fuentes;

    public ResolutorClave(List<ProveedorClave> fuentes) {
        this.fuentes = fuentes;
    }

    public Resultado resolver() {
        java.util.ArrayList<String> mensajes = new java.util.ArrayList<>();
        for (ProveedorClave f : fuentes) {
            Optional<String> clave = f.obtener();
            if (clave.isEmpty()) continue;
            if (clave.get().length() >= LARGO_MINIMO) {
                mensajes.add("Clave de administrador cargada desde " + f.origen() + " (no se muestra).");
                return new Resultado(clave.get(), mensajes);
            }
            mensajes.add("ATENCION: la clave de " + f.origen() + " tiene menos de " + LARGO_MINIMO
                    + " caracteres, se ignora.");
        }
        SecureRandom azar = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) sb.append(ALFABETO.charAt(azar.nextInt(ALFABETO.length())));
        mensajes.add("No hay clave configurada. Clave de administrador de ESTA ejecucion: " + sb);
        mensajes.add("Para fijar una clave propia, escribela en admin.properties (clave=...).");
        return new Resultado(sb.toString(), mensajes);
    }
}
