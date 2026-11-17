package evacuacion.datos;

import evacuacion.modelo.MapaCampus;

/**
 * Dónde viven los datos del campus. La capa de negocio solo conoce esta interfaz:
 * hoy el mapa está en memoria, mañana podría venir de un archivo o de una base de datos
 * sin cambiar nada más (GRASP Variaciones protegidas / Indirección, SOLID O).
 */
public interface RepositorioMapa {

    MapaCampus obtener();
}
