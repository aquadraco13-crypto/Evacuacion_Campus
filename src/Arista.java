
public class Arista {

    public final String a;
    public final String b;
    public final double metros;
    public final double riesgo;

    public Arista(String a, String b, double metros, double riesgo) {
        this.a = a;
        this.b = b;
        this.metros = metros;
        this.riesgo = riesgo;
    }

    /** Peso que usa Dijkstra: distancia ajustada por el riesgo. */
    public double costo() {
        return metros * riesgo;
    }

    public String otroExtremo(String id) {
        return id.equals(a) ? b : a;
    }

    /** Clave única sin importar el orden, p. ej. "A1|PA". */
    public String clave() {
        return clave(a, b);
    }

    public static String clave(String x, String y) {
        return x.compareTo(y) < 0 ? x + "|" + y : y + "|" + x;
    }
}
