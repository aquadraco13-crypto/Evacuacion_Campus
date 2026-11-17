package evacuacion.modelo;

import java.util.Set;

/**
 * Lo que está bloqueado en este momento (puntos y caminos).
 * GRASP Experto en información: quien guarda los bloqueos responde si algo está bloqueado.
 * Reemplaza el par de Set suelto que antes viajaba por todas partes.
 */
public record Restricciones(Set<String> nodos, Set<String> aristas) {

    public Restricciones {
        nodos = Set.copyOf(nodos);
        aristas = Set.copyOf(aristas);
    }

    public static Restricciones ninguna() {
        return new Restricciones(Set.of(), Set.of());
    }

    public boolean bloqueaNodo(String id) {
        return nodos.contains(id);
    }

    public boolean bloqueaArista(Arista a) {
        return aristas.contains(a.clave());
    }
}
