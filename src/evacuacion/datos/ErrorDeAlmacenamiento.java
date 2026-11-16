package evacuacion.datos;

/** Falló el almacenamiento (por ejemplo, la base de datos no responde). Lo usan todos los repositorios. */
public class ErrorDeAlmacenamiento extends RuntimeException {

    public ErrorDeAlmacenamiento(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }

    public ErrorDeAlmacenamiento(String mensaje) {
        super(mensaje);
    }
}
