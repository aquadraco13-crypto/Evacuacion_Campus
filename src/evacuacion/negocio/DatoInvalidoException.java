package evacuacion.negocio;

/** Se lanza cuando alguien manda un dato que no existe o no tiene sentido (por ejemplo un punto desconocido). */
public class DatoInvalidoException extends RuntimeException {

    public DatoInvalidoException(String mensaje) {
        super(mensaje);
    }
}
