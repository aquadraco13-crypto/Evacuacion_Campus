package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;

/** POST /api/logout: cierra la sesión de administrador. */
public class LogoutControlador implements Controlador {

    private final SesionHttp sesion;

    public LogoutControlador(SesionHttp sesion) {
        this.sesion = sesion;
    }

    @Override public String ruta() { return "/api/logout"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        if (Http.leerForm(ex) == null) return;
        sesion.cerrar(ex);
        Http.responder(ex, 200, Http.JSON, "{\"ok\":true}");
    }
}
