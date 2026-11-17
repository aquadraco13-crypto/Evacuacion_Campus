package evacuacion.datos;

import evacuacion.modelo.EstadoEmergencia;

/** Guarda y devuelve el estado de la emergencia. Solo guarda: las reglas viven en EmergenciaServicio. */
public interface RepositorioEmergencia {

    EstadoEmergencia obtener();

    void guardar(EstadoEmergencia estado);
}
