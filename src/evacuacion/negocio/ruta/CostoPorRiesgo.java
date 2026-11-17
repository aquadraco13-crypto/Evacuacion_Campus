package evacuacion.negocio.ruta;

import evacuacion.modelo.Arista;

/** Costo = metros × riesgo: un camino corto pero peligroso "pesa" más que un rodeo seguro. */
public class CostoPorRiesgo implements CalculadoraCosto {

    @Override
    public double costo(Arista arista) {
        return arista.metros * arista.riesgo;
    }
}
