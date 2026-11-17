package evacuacion.modelo;

import java.util.List;

/**
 * Respuesta del sistema a "¿cómo salgo?". Solo datos: ya no sabe escribirse como JSON
 * (eso es de la capa de presentación; SOLID S).
 */
public record PlanEvacuacion(String origen, boolean ok, String mensaje,
                             OpcionEvacuacion mejor, List<OpcionEvacuacion> opciones) { }
