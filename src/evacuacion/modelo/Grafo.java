package evacuacion.modelo;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/** Grafo no dirigido con listas de adyacencia: sabe sus nodos, sus caminos y sus vecinos. */
public class Grafo {

    
    public static final double METROS_POR_PIXEL = 0.25;

    private final Map<String, Nodo> nodos = new LinkedHashMap<>();
    private final Map<String, List<Arista>> adyacencia = new HashMap<>();
    private final List<Arista> aristas = new ArrayList<>();

    public void agregarNodo(Nodo n) {
        nodos.put(n.id, n);
        adyacencia.putIfAbsent(n.id, new ArrayList<>());
    }

    
    public void conectar(String a, String b, double riesgo) {
        Nodo na = nodos.get(a);
        Nodo nb = nodos.get(b);
        if (na == null || nb == null) {
            throw new IllegalArgumentException("Nodo inexistente: " + a + " o " + b);
        }
        double pixeles = Math.hypot(na.x - nb.x, na.y - nb.y);
        double metros = Math.round(pixeles * METROS_POR_PIXEL * 10) / 10.0;
        agregarArista(new Arista(a, b, metros, riesgo));
    }

    /** Agrega un camino ya armado (por ejemplo, uno leído de la base de datos con sus metros guardados). */
    public void agregarArista(Arista ar) {
        if (!nodos.containsKey(ar.a) || !nodos.containsKey(ar.b)) {
            throw new IllegalArgumentException("Nodo inexistente: " + ar.a + " o " + ar.b);
        }
        aristas.add(ar);
        adyacencia.get(ar.a).add(ar);
        adyacencia.get(ar.b).add(ar);
    }

    public void conectar(String a, String b) {
        conectar(a, b, 1.0);
    }

    public Nodo nodo(String id) {
        return nodos.get(id);
    }

    public Collection<Nodo> nodos() {
        return nodos.values();
    }

    public List<Arista> aristas() {
        return aristas;
    }

    public List<Arista> vecinos(String id) {
        return adyacencia.getOrDefault(id, List.of());
    }

    public Arista buscar(String a, String b) {
        for (Arista ar : vecinos(a)) {
            if (ar.otroExtremo(a).equals(b)) return ar;
        }
        return null;
    }

    
    public double distancia(List<String> camino) {
        double total = 0;
        for (int i = 0; i + 1 < camino.size(); i++) {
            Arista ar = buscar(camino.get(i), camino.get(i + 1));
            if (ar != null) total += ar.metros;
        }
        return total;
    }
}
