package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.DatoInvalidoException;
import evacuacion.negocio.servicios.EmergenciaServicio;
import evacuacion.presentacion.json.EstadoJson;

import java.io.IOException;
import java.util.Map;

/** POST /api/admin/bloqueos (nodos=a,b&aristas=x|y): solo administradores. */
public class BloqueosAdminControlador implements Controlador {

    private final EmergenciaServicio emergencia;
    private final SesionHttp sesion;

    public BloqueosAdminControlador(EmergenciaServicio emergencia, SesionHttp sesion) {
        this.emergencia = emergencia;
        this.sesion = sesion;
    }

    @Override public String ruta() { return "/api/admin/bloqueos"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        Map<String, String> form = Http.leerForm(ex);
        if (form == null || !sesion.exigirAdmin(ex)) return;
        try {
            var estado = emergencia.fijarBloqueos(Http.lista(form.get("nodos")), Http.lista(form.get("aristas")));
            Http.responder(ex, 200, Http.JSON, EstadoJson.de(estado));
        } catch (DatoInvalidoException e) {
            Http.responder(ex, 400, Http.JSON, "{\"ok\":false,\"mensaje\":\"Bloqueo inválido.\"}");
        }
    }
}
