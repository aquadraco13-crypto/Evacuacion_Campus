package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;
import evacuacion.negocio.servicios.MapaServicio;
import evacuacion.presentacion.json.MapaJson;

import java.io.IOException;

/** GET /api/campus: el mapa (puntos y caminos). */
public class MapaControlador implements Controlador {

    private final MapaServicio mapa;

    public MapaControlador(MapaServicio mapa) {
        this.mapa = mapa;
    }

    @Override public String ruta() { return "/api/campus"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        if (!Http.soloGet(ex)) return;
        Http.responder(ex, 200, Http.JSON, MapaJson.de(mapa.obtener()));
    }
}
