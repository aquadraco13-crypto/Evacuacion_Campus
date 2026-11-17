package evacuacion.datos.memoria;

import evacuacion.datos.RepositorioEmergencia;
import evacuacion.modelo.EstadoEmergencia;

/** Estado de la emergencia guardado en memoria (se pierde al reiniciar el servidor). */
public class EmergenciaEnMemoria implements RepositorioEmergencia {

    private volatile EstadoEmergencia actual = EstadoEmergencia.inicial();

    @Override
    public EstadoEmergencia obtener() {
        return actual;
    }

    @Override
    public void guardar(EstadoEmergencia estado) {
        actual = estado;
    }
}
