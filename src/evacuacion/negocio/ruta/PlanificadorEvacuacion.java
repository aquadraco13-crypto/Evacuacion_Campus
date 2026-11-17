package evacuacion.negocio.ruta;

import evacuacion.modelo.Grafo;
import evacuacion.modelo.Nodo;
import evacuacion.modelo.OpcionEvacuacion;
import evacuacion.modelo.PlanEvacuacion;
import evacuacion.modelo.Restricciones;
import evacuacion.modelo.ResultadoRuta;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Elige el mejor punto de encuentro. GRASP Fabricación pura: no es un objeto del campus,
 * es una clase creada para mantener cohesionada esta regla de negocio.
 * No sabe qué algoritmo ni qué criterio de costo usa: se los entregan (SOLID O, Polimorfismo).
 */
public class PlanificadorEvacuacion {

    private final AlgoritmoRuta algoritmo;
    private final CalculadoraCosto costos;

    public PlanificadorEvacuacion(AlgoritmoRuta algoritmo, CalculadoraCosto costos) {
        this.algoritmo = algoritmo;
        this.costos = costos;
    }

    public PlanEvacuacion planificar(Grafo g, String origen, Restricciones bloqueos) {
        if (origen == null || g.nodo(origen) == null) {
            return new PlanEvacuacion(origen, false, "Elige tu ubicación en el mapa.", null, List.of());
        }
        if (bloqueos.bloqueaNodo(origen)) {
            return new PlanEvacuacion(origen, false,
                    "Tu ubicación está marcada como bloqueada. Muévela a un punto libre.", null, List.of());
        }

        ResultadoRuta r = algoritmo.calcular(g, origen, bloqueos, costos);

        List<OpcionEvacuacion> opciones = new ArrayList<>();
        for (Nodo n : g.nodos()) {
            if (!n.esPuntoDeEncuentro()) continue;
            if (r.alcanzable(n.id)) {
                List<String> camino = r.camino(n.id);
                opciones.add(new OpcionEvacuacion(n.id, n.nombre, true,
                        r.costoHasta(n.id), g.distancia(camino), camino));
            } else {
                opciones.add(new OpcionEvacuacion(n.id, n.nombre, false, Double.NaN, Double.NaN, List.of()));
            }
        }

        // Primero los alcanzables, de menor a mayor costo
        opciones.sort(Comparator.comparing((OpcionEvacuacion o) -> !o.alcanzable())
                .thenComparingDouble(o -> o.alcanzable() ? o.costo() : 0));

        OpcionEvacuacion mejor = opciones.isEmpty() || !opciones.get(0).alcanzable() ? null : opciones.get(0);
        if (mejor == null) {
            return new PlanEvacuacion(origen, false,
                    "No existe una ruta segura hacia ningún punto de encuentro con los bloqueos actuales. "
                            + "Espera instrucciones de la brigada de emergencia.", null, opciones);
        }
        return new PlanEvacuacion(origen, true, null, mejor, opciones);
    }
}
