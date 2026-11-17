package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.concurrent.Executors;

/**
 * Arranca el servidor HTTP y le registra los controladores que reciba.
 * No conoce ninguno en particular (SOLID O): agregar un endpoint no obliga a modificar esta clase.
 */
public class ServidorWeb {

    private final int puerto;
    private final List<Controlador> controladores;

    public ServidorWeb(int puerto, List<Controlador> controladores) {
        this.puerto = puerto;
        this.controladores = controladores;
    }

    public void iniciar() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(puerto), 0);
        for (Controlador c : controladores) {
            server.createContext(c.ruta(), c::manejar);
        }
        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();
    }
}
