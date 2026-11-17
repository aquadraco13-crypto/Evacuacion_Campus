package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.servicios.AutenticacionServicio;
import evacuacion.presentacion.json.Json;

import java.io.IOException;
import java.util.Map;

/** POST /api/login (clave=...): abre la sesión de administrador. */
public class LoginControlador implements Controlador {

    private final AutenticacionServicio autenticacion;
    private final SesionHttp sesion;

    public LoginControlador(AutenticacionServicio autenticacion, SesionHttp sesion) {
        this.autenticacion = autenticacion;
        this.sesion = sesion;
    }

    @Override public String ruta() { return "/api/login"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        Map<String, String> form = Http.leerForm(ex);
        if (form == null) return;
        var intento = autenticacion.iniciarSesion(form.get("clave"), Http.ipCliente(ex));
        switch (intento.resultado()) {
            case OK -> {
                sesion.abrir(ex, intento.token());
                Http.responder(ex, 200, Http.JSON, "{\"ok\":true}");
            }
            case BLOQUEADA -> Http.responder(ex, 429, Http.JSON, "{\"ok\":false,\"mensaje\":"
                    + Json.str("Demasiados intentos. Espera un minuto e intenta de nuevo.") + "}");
            default -> Http.responder(ex, 401, Http.JSON, "{\"ok\":false,\"mensaje\":"
                    + Json.str("Clave incorrecta.") + "}");
        }
    }
}
