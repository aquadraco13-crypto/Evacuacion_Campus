package evacuacion.presentacion.json;

import evacuacion.modelo.OpcionEvacuacion;
import evacuacion.modelo.PlanEvacuacion;

/** Cómo se ve un plan de evacuación como JSON. */
public final class PlanJson {

    private PlanJson() { }

    public static String de(PlanEvacuacion plan) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"ok\":").append(plan.ok());
        sb.append(",\"origen\":").append(Json.str(plan.origen()));
        if (plan.ok()) {
            OpcionEvacuacion mejor = plan.mejor();
            sb.append(",\"destino\":").append(Json.str(mejor.id()));
            sb.append(",\"destinoNombre\":").append(Json.str(mejor.nombre()));
            sb.append(",\"distanciaM\":").append(Json.num(mejor.distanciaM()));
            sb.append(",\"tiempoS\":").append(mejor.tiempoSegundos());
            sb.append(",\"camino\":").append(Json.lista(mejor.camino()));
        } else {
            sb.append(",\"mensaje\":").append(Json.str(plan.mensaje()));
        }
        sb.append(",\"opciones\":[");
        for (int i = 0; i < plan.opciones().size(); i++) {
            OpcionEvacuacion o = plan.opciones().get(i);
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

    /** Respuesta para un estudiante cuando todavía no hay emergencia. */
    public static String sinEmergencia() {
        return "{\"ok\":false,\"inactiva\":true,\"mensaje\":"
                + Json.str("No hay ninguna emergencia activa.") + ",\"opciones\":[]}";
    }
}
