package evacuacion.negocio.servicios;

import evacuacion.datos.RepositorioEmergencia;
import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.EstadoEmergencia;
import evacuacion.modelo.PlanEvacuacion;
import evacuacion.negocio.ruta.PlanificadorEvacuacion;

/**
 * Caso de uso: "¿cómo salgo?". Regla: sin emergencia activa, solo los administradores
 * pueden ver rutas (para ensayar); los estudiantes no.
 * Usa SIEMPRE los bloqueos guardados en el servidor, nunca los que mande un cliente.
 */
public class EvacuacionServicio {

    /** Resultado de la consulta: o no hay emergencia (sin plan) o hay un plan. */
    public record Consulta(boolean sinEmergencia, PlanEvacuacion plan) { }

    private final RepositorioMapa mapa;
    private final RepositorioEmergencia emergencia;
    private final PlanificadorEvacuacion planificador;

    public EvacuacionServicio(RepositorioMapa mapa, RepositorioEmergencia emergencia,
                              PlanificadorEvacuacion planificador) {
        this.mapa = mapa;
        this.emergencia = emergencia;
        this.planificador = planificador;
    }

    public Consulta consultar(String origen, boolean esAdmin) {
        EstadoEmergencia estado = emergencia.obtener();
        if (!estado.activa() && !esAdmin) return new Consulta(true, null);
        return new Consulta(false,
                planificador.planificar(mapa.obtener().grafo(), origen, estado.restricciones()));
    }
}
