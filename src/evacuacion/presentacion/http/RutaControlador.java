package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.servicios.EvacuacionServicio;
import evacuacion.presentacion.json.Json;
import evacuacion.presentacion.json.PlanJson;

import java.io.IOException;
import java.util.Map;

/** GET /api/ruta?origen=ID: la ruta hacia el mejor punto de encuentro. Ignora cualquier bloqueo mandado por el cliente. */
public class RutaControlador implements Controlador {

    private final EvacuacionServicio evacuacion;
    private final SesionHttp sesion;

    public RutaControlador(EvacuacionServicio evacuacion, SesionHttp sesion) {
        this.evacuacion = evacuacion;
        this.sesion = sesion;
    }

    @Override public String ruta() { return "/api/ruta"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        if (!Http.soloGet(ex)) return;
        try {
            Map<String, String> q = Http.parametros(ex.getRequestURI());
            var consulta = evacuacion.consultar(q.get("origen"), sesion.esAdmin(ex));
            String json = consulta.sinEmergencia() ? PlanJson.sinEmergencia() : PlanJson.de(consulta.plan());
            Http.responder(ex, 200, Http.JSON, json);
        } catch (RuntimeException e) {
            Http.responder(ex, 500, Http.JSON, "{\"ok\":false,\"mensaje\":" + Json.str("Error interno.") + "}");
        }
    }
}
