package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;

/**
 * Un "endpoint" del servidor. Polimorfismo (GRASP) y SOLID O: para agregar una dirección nueva
 * se crea una clase que implemente esta interfaz y se registra en Main; ServidorWeb no se modifica.
 * Contrato (SOLID L): siempre responde la petición (nunca la deja colgada).
 */
public interface Controlador {

    /** Ruta que atiende, por ejemplo "/api/estado". */
    String ruta();

    void manejar(HttpExchange ex) throws IOException;
}
