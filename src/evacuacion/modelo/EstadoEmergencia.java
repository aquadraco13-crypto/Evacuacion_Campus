package evacuacion.modelo;

/** Foto del estado de la emergencia. "version" sube cada vez que algo cambia. */
public record EstadoEmergencia(boolean activa, long version, Restricciones restricciones) {

    public static EstadoEmergencia inicial() {
        return new EstadoEmergencia(false, 0, Restricciones.ninguna());
    }
}
