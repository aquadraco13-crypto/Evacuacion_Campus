package evacuacion.negocio.ruta;

import evacuacion.modelo.Arista;
import evacuacion.modelo.Grafo;
import evacuacion.modelo.Restricciones;
import evacuacion.modelo.ResultadoRuta;

/**
 * Segunda implementación de AlgoritmoRuta (Bellman-Ford, O(V·E)).
 * Es más lento que Dijkstra, pero cumple el mismo contrato: se puede poner en su lugar
 * y las rutas siguen siendo de costo mínimo. Es la prueba viva de SOLID O y L.
 */
public class BellmanFord implements AlgoritmoRuta {

    @Override
    public ResultadoRuta calcular(Grafo g, String origen, Restricciones bloqueos, CalculadoraCosto costos) {
        ResultadoRuta r = new ResultadoRuta(origen);
        if (g.nodo(origen) == null || bloqueos.bloqueaNodo(origen)) return r;

        r.registrar(origen, 0.0, null);
        int vueltas = g.nodos().size() - 1;
        for (int i = 0; i < vueltas; i++) {
            boolean cambio = false;
            for (Arista ar : g.aristas()) {
                if (bloqueos.bloqueaArista(ar)) continue;
                cambio |= relajar(r, ar.a, ar.b, costos.costo(ar), bloqueos);
                cambio |= relajar(r, ar.b, ar.a, costos.costo(ar), bloqueos);
            }
            if (!cambio) break;
        }
        return r;
    }

    private boolean relajar(ResultadoRuta r, String desde, String hacia, double peso, Restricciones bloqueos) {
        if (!r.alcanzable(desde) || bloqueos.bloqueaNodo(hacia)) return false;
        double nuevo = r.costoHasta(desde) + peso;
        if (nuevo < r.costoHasta(hacia)) {
            r.registrar(hacia, nuevo, desde);
            return true;
        }
        return false;
    }
}
