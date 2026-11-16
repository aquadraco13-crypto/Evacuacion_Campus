package evacuacion.presentacion.json;

import evacuacion.modelo.Arista;
import evacuacion.modelo.MapaCampus;
import evacuacion.modelo.Nodo;
import evacuacion.modelo.OpcionEvacuacion;

/** Cómo se ve el mapa del campus como JSON (vista; el modelo no sabe de JSON). */
public final class MapaJson {

    private MapaJson() { }

    public static String de(MapaCampus mapa) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"ancho\":").append(mapa.ancho()).append(",\"alto\":").append(mapa.alto());
        sb.append(",\"velocidadMs\":").append(OpcionEvacuacion.VELOCIDAD_MS);

        sb.append(",\"nodos\":[");
        boolean primero = true;
        for (Nodo n : mapa.grafo().nodos()) {
            if (!primero) sb.append(',');
            primero = false;
            sb.append("{\"id\":").append(Json.str(n.id));
            sb.append(",\"nombre\":").append(Json.str(n.nombre));
            sb.append(",\"x\":").append(n.x).append(",\"y\":").append(n.y);
            sb.append(",\"tipo\":").append(Json.str(n.tipo.name())).append('}');
        }

        sb.append("],\"aristas\":[");
        primero = true;
        for (Arista ar : mapa.grafo().aristas()) {
            if (!primero) sb.append(',');
            primero = false;
            sb.append("{\"a\":").append(Json.str(ar.a));
            sb.append(",\"b\":").append(Json.str(ar.b));
            sb.append(",\"metros\":").append(Json.num(ar.metros));
            sb.append(",\"riesgo\":").append(Json.num(ar.riesgo));
            sb.append(",\"clave\":").append(Json.str(ar.clave())).append('}');
        }
        return sb.append("]}").toString();
    }
}
