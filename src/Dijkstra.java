import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;


public class Dijkstra {

    private record Entrada(String id, double costo) { }

    public static class Resultado {
        public final String origen;
        public final Map<String, Double> costo = new HashMap<>();
        public final Map<String, String> previo = new HashMap<>();

        Resultado(String origen) {
            this.origen = origen;
        }

        public boolean alcanzable(String id) {
            return costo.containsKey(id);
        }

        /** Reconstruye el camino origen -> destino siguiendo los "previos". Vacío si no hay ruta. */
        public List<String> camino(String destino) {
            List<String> ruta = new ArrayList<>();
            if (!alcanzable(destino)) return ruta;
            for (String actual = destino; actual != null; actual = previo.get(actual)) {
                ruta.add(actual);
            }
            Collections.reverse(ruta);
            return ruta;
        }
    }

    public static Resultado calcular(Grafo g, String origen,
                                     Set<String> nodosBloqueados, Set<String> aristasBloqueadas) {
        Resultado r = new Resultado(origen);
        if (g.nodo(origen) == null || nodosBloqueados.contains(origen)) return r;

        PriorityQueue<Entrada> cola = new PriorityQueue<>(Comparator.comparingDouble(Entrada::costo));
        Set<String> visitados = new HashSet<>();

        r.costo.put(origen, 0.0);
        cola.add(new Entrada(origen, 0.0));

        while (!cola.isEmpty()) {
            Entrada actual = cola.poll();
            if (!visitados.add(actual.id())) continue;   // ya se procesó con un costo menor

            for (Arista ar : g.vecinos(actual.id())) {
                if (aristasBloqueadas.contains(ar.clave())) continue;
                String vecino = ar.otroExtremo(actual.id());
                if (nodosBloqueados.contains(vecino)) continue;

                double nuevo = actual.costo() + ar.costo();
                if (nuevo < r.costo.getOrDefault(vecino, Double.POSITIVE_INFINITY)) {
                    r.costo.put(vecino, nuevo);
                    r.previo.put(vecino, actual.id());
                    cola.add(new Entrada(vecino, nuevo));
                }
            }
        }
        return r;
    }
}
