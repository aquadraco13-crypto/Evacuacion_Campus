package evacuacion.negocio.servicios;

import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.MapaCampus;

/** Caso de uso: consultar el mapa. Evita que la presentación hable directo con la capa de datos (Indirección). */
public class MapaServicio {

    private final RepositorioMapa repositorio;

    public MapaServicio(RepositorioMapa repositorio) {
        this.repositorio = repositorio;
    }

    public MapaCampus obtener() {
        return repositorio.obtener();
    }
}
