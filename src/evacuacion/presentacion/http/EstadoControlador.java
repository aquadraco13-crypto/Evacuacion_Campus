package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.servicios.EmergenciaServicio;
import evacuacion.presentacion.json.EstadoJson;

import java.io.IOException;

/** GET /api/estado (público): ¿hay emergencia?, ¿qué está bloqueado?, ¿soy administrador? */
public class EstadoControlador implements Controlador {

    private final EmergenciaServicio emergencia;
    private final SesionHttp sesion;

    public EstadoControlador(EmergenciaServicio emergencia, SesionHttp sesion) {
        this.emergencia = emergencia;
        this.sesion = sesion;
    }

    @Override public String ruta() { return "/api/estado"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        if (!Http.soloGet(ex)) return;
        Http.responder(ex, 200, Http.JSON, EstadoJson.de(emergencia.consultar(), sesion.esAdmin(ex)));
    }
}
