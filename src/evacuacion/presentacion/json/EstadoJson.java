package evacuacion.presentacion.json;

import evacuacion.modelo.EstadoEmergencia;

import java.util.List;
import java.util.TreeSet;

/** Cómo se ve el estado de la emergencia como JSON. */
public final class EstadoJson {

    private EstadoJson() { }

    public static String de(EstadoEmergencia e) {
        return cuerpo(e) + "}";
    }

    /** Igual, pero avisando a la página si quien pregunta es administrador. */
    public static String de(EstadoEmergencia e, boolean admin) {
        return cuerpo(e) + ",\"admin\":" + admin + "}";
    }

    private static String cuerpo(EstadoEmergencia e) {
        return "{\"emergencia\":" + e.activa()
                + ",\"version\":" + e.version()
                + ",\"nodos\":" + Json.lista(List.copyOf(new TreeSet<>(e.restricciones().nodos())))
                + ",\"aristas\":" + Json.lista(List.copyOf(new TreeSet<>(e.restricciones().aristas())));
    }
}
