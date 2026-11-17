package evacuacion.negocio.ruta;

import evacuacion.modelo.Grafo;
import evacuacion.modelo.Restricciones;
import evacuacion.modelo.ResultadoRuta;

/**
 * Estrategia: cómo se calcula el camino de menor costo desde un origen hacia todos los nodos.
 *
 * Contrato (SOLID L) para cualquier implementación:
 *  - el costo registrado para cada nodo alcanzable es el MÍNIMO posible (con la CalculadoraCosto dada);
 *  - nunca pasa por nodos ni caminos bloqueados;
 *  - si el origen no existe o está bloqueado, devuelve un resultado sin nodos alcanzables (no lanza excepción).
 */
public interface AlgoritmoRuta {

    ResultadoRuta calcular(Grafo grafo, String origen, Restricciones restricciones, CalculadoraCosto costos);
}
