package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.servicios.AutenticacionServicio;

import java.io.IOException;

/** Puente entre HTTP (la cookie "sesion") y AutenticacionServicio: ¿quién es el que pregunta? */
public class SesionHttp {

    static final String COOKIE = "sesion";

    private final AutenticacionServicio autenticacion;

    public SesionHttp(AutenticacionServicio autenticacion) {
        this.autenticacion = autenticacion;
    }

    public boolean esAdmin(HttpExchange ex) {
        return autenticacion.esAdmin(Http.cookie(ex, COOKIE));
    }

    /** Responde 401 y devuelve false si no es administrador. */
    public boolean exigirAdmin(HttpExchange ex) throws IOException {
        if (esAdmin(ex)) return true;
        Http.responder(ex, 401, Http.JSON, "{\"ok\":false,\"mensaje\":\"Solo administradores.\"}");
        return false;
    }

    public void abrir(HttpExchange ex, String token) {
        ex.getResponseHeaders().add("Set-Cookie", COOKIE + "=" + token
                + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + (AutenticacionServicio.DURACION_MS / 1000)
                + (Http.conHttps(ex) ? "; Secure" : ""));
    }

    public void cerrar(HttpExchange ex) {
        autenticacion.cerrarSesion(Http.cookie(ex, COOKIE));
        ex.getResponseHeaders().add("Set-Cookie", COOKIE + "=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
    }
}
