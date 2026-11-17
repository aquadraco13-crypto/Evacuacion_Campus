package evacuacion.modelo;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Lo que devuelve cualquier AlgoritmoRuta: costo mínimo hasta cada nodo alcanzable y el camino para llegar. */
public class ResultadoRuta {

    public final String origen;
    private final Map<String, Double> costo = new HashMap<>();
    private final Map<String, String> previo = new HashMap<>();

    public ResultadoRuta(String origen) {
        this.origen = origen;
    }

    public void registrar(String nodo, double costoHasta, String previoNodo) {
        costo.put(nodo, costoHasta);
        if (previoNodo == null) previo.remove(nodo);
        else previo.put(nodo, previoNodo);
    }

    public boolean alcanzable(String id) {
        return costo.containsKey(id);
    }

    public double costoHasta(String id) {
        return costo.getOrDefault(id, Double.POSITIVE_INFINITY);
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
