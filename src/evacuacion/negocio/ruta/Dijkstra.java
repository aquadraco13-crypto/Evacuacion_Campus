package evacuacion.negocio.ruta;

import evacuacion.modelo.Arista;
import evacuacion.modelo.Grafo;
import evacuacion.modelo.Restricciones;
import evacuacion.modelo.ResultadoRuta;

import java.util.Comparator;
import java.util.HashSet;
import java.util.PriorityQueue;
import java.util.Set;

/** Algoritmo de Dijkstra con cola de prioridad: O((V + E) log V). Solo sirve con costos no negativos. */
public class Dijkstra implements AlgoritmoRuta {

    private record Entrada(String id, double costo) { }

    @Override
    public ResultadoRuta calcular(Grafo g, String origen, Restricciones bloqueos, CalculadoraCosto costos) {
        ResultadoRuta r = new ResultadoRuta(origen);
        if (g.nodo(origen) == null || bloqueos.bloqueaNodo(origen)) return r;

        PriorityQueue<Entrada> cola = new PriorityQueue<>(Comparator.comparingDouble(Entrada::costo));
        Set<String> visitados = new HashSet<>();

        r.registrar(origen, 0.0, null);
        cola.add(new Entrada(origen, 0.0));

        while (!cola.isEmpty()) {
            Entrada actual = cola.poll();
            if (!visitados.add(actual.id())) continue;   // ya se procesó con un costo menor

            for (Arista ar : g.vecinos(actual.id())) {
                if (bloqueos.bloqueaArista(ar)) continue;
                String vecino = ar.otroExtremo(actual.id());
                if (bloqueos.bloqueaNodo(vecino)) continue;

                double nuevo = actual.costo() + costos.costo(ar);
                if (nuevo < r.costoHasta(vecino)) {
                    r.registrar(vecino, nuevo, actual.id());
                    cola.add(new Entrada(vecino, nuevo));
                }
            }
        }
        return r;
    }
}
