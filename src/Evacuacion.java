import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;


public class Evacuacion {

    
    public static final double VELOCIDAD_MS = 1.5;

    public record Opcion(String id, String nombre, boolean alcanzable,
                         double costo, double distanciaM, List<String> camino) { }

    public record Plan(String origen, boolean ok, String mensaje, Opcion mejor, List<Opcion> opciones) {

        public String toJson() {
            StringBuilder sb = new StringBuilder("{");
            sb.append("\"ok\":").append(ok);
            sb.append(",\"origen\":").append(Json.str(origen));
            if (ok) {
                sb.append(",\"destino\":").append(Json.str(mejor.id()));
                sb.append(",\"destinoNombre\":").append(Json.str(mejor.nombre()));
                sb.append(",\"distanciaM\":").append(Json.num(mejor.distanciaM()));
                sb.append(",\"tiempoS\":").append(Math.round(mejor.distanciaM() / VELOCIDAD_MS));
                sb.append(",\"camino\":").append(Json.lista(mejor.camino()));
            } else {
                sb.append(",\"mensaje\":").append(Json.str(mensaje));
            }
            sb.append(",\"opciones\":[");
            for (int i = 0; i < opciones.size(); i++) {
                Opcion o = opciones.get(i);
                if (i > 0) sb.append(',');
                sb.append("{\"id\":").append(Json.str(o.id()));
                sb.append(",\"nombre\":").append(Json.str(o.nombre()));
                sb.append(",\"alcanzable\":").append(o.alcanzable());
                sb.append(",\"distanciaM\":").append(Json.num(o.distanciaM()));
                sb.append(",\"costo\":").append(Json.num(o.costo()));
                sb.append('}');
            }
            return sb.append("]}").toString();
        }
    }

    public static Plan calcular(Grafo g, String origen, Set<String> nodosBloq, Set<String> aristasBloq) {
        if (origen == null || g.nodo(origen) == null) {
            return new Plan(origen, false, "Elige tu ubicación en el mapa.", null, List.of());
        }
        if (nodosBloq.contains(origen)) {
            return new Plan(origen, false,
                    "Tu ubicación está marcada como bloqueada. Muévela a un punto libre.", null, List.of());
        }

        Dijkstra.Resultado r = Dijkstra.calcular(g, origen, nodosBloq, aristasBloq);

        List<Opcion> opciones = new ArrayList<>();
        for (Nodo n : g.nodos()) {
            if (!n.esPuntoDeEncuentro()) continue;
            if (r.alcanzable(n.id)) {
                List<String> camino = r.camino(n.id);
                opciones.add(new Opcion(n.id, n.nombre, true, r.costo.get(n.id), g.distancia(camino), camino));
            } else {
                opciones.add(new Opcion(n.id, n.nombre, false, Double.NaN, Double.NaN, List.of()));
            }
        }

        
        opciones.sort(Comparator.comparing((Opcion o) -> !o.alcanzable())
                .thenComparingDouble(o -> o.alcanzable() ? o.costo() : 0));

        Opcion mejor = opciones.isEmpty() || !opciones.get(0).alcanzable() ? null : opciones.get(0);
        if (mejor == null) {
            return new Plan(origen, false,
                    "No existe una ruta segura hacia ningún punto de encuentro con los bloqueos actuales. "
                            + "Espera instrucciones de la brigada de emergencia.", null, opciones);
        }
        return new Plan(origen, true, null, mejor, opciones);
    }
}
