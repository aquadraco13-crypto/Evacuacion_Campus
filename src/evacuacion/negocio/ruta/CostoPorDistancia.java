package evacuacion.negocio.ruta;

import evacuacion.modelo.Arista;

/** Costo = solo metros (ignora el riesgo). Sirve de alternativa y para probar que el criterio es intercambiable. */
public class CostoPorDistancia implements CalculadoraCosto {

    @Override
    public double costo(Arista arista) {
        return arista.metros;
    }
}
