package evacuacion.modelo;

import java.util.List;

/** Un punto de encuentro como destino posible: si se llega, cuánto cuesta, cuántos metros y por dónde. */
public record OpcionEvacuacion(String id, String nombre, boolean alcanzable,
                               double costo, double distanciaM, List<String> camino) {

    /** Velocidad de caminata usada para estimar el tiempo (metros por segundo). */
    public static final double VELOCIDAD_MS = 1.5;

    public long tiempoSegundos() {
        return Math.round(distanciaM / VELOCIDAD_MS);
    }
}
