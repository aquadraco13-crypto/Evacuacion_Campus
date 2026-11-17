package evacuacion.negocio.ruta;

import evacuacion.modelo.Arista;

/**
 * Estrategia: cuánto "cuesta" recorrer un camino. Es lo que los algoritmos minimizan.
 *
 * Contrato (SOLID L) que debe cumplir CUALQUIER implementación:
 *  - devuelve un número finito y mayor o igual que 0 (Dijkstra lo necesita);
 *  - da el mismo valor sin importar en qué sentido se recorra la arista.
 * Si lo cumple, se puede cambiar una por otra sin tocar los algoritmos (SOLID O).
 */
public interface CalculadoraCosto {

    double costo(Arista arista);
}
