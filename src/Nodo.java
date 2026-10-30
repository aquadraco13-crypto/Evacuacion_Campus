
public class Nodo {

    public enum Tipo { SALON, PASILLO, SALIDA, PUNTO_ENCUENTRO }

    public final String id;
    public final String nombre;
    public final int x;      // posición en el plano (píxeles), solo para dibujar el mapa
    public final int y;
    public final Tipo tipo;

    public Nodo(String id, String nombre, int x, int y, Tipo tipo) {
        this.id = id;
        this.nombre = nombre;
        this.x = x;
        this.y = y;
        this.tipo = tipo;
    }

    public boolean esPuntoDeEncuentro() {
        return tipo == Tipo.PUNTO_ENCUENTRO;
    }
}
