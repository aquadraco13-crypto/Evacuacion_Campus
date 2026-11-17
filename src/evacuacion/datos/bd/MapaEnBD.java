package evacuacion.datos.bd;

import evacuacion.datos.ErrorDeAlmacenamiento;
import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.Arista;
import evacuacion.modelo.Grafo;
import evacuacion.modelo.MapaCampus;
import evacuacion.modelo.Nodo;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * El mapa del campus leído de PostgreSQL. Se lee UNA vez al crear el repositorio (el plano casi no
 * cambia) y queda en memoria; si se edita el plano en la base, se reinicia el servidor.
 * Reemplaza a MapaEnMemoria sin que cambie nada en negocio ni presentación (SOLID O y L).
 */
public class MapaEnBD implements RepositorioMapa {

    private final MapaCampus mapa;

    public MapaEnBD(ConexionBD bd) {
        this.mapa = leer(bd);
    }

    @Override
    public MapaCampus obtener() {
        return mapa;
    }

    private static MapaCampus leer(ConexionBD bd) {
        try (Connection c = bd.abrir(); Statement st = c.createStatement()) {
            int ancho;
            int alto;
            try (ResultSet rs = st.executeQuery("SELECT ancho, alto FROM plano WHERE id = 1")) {
                if (!rs.next()) {
                    throw new ErrorDeAlmacenamiento("La base de datos no tiene el mapa del campus (tabla plano vacía)");
                }
                ancho = rs.getInt(1);
                alto = rs.getInt(2);
            }
            Grafo g = new Grafo();
            try (ResultSet rs = st.executeQuery("SELECT id, nombre, x, y, tipo FROM nodo ORDER BY orden")) {
                while (rs.next()) {
                    g.agregarNodo(new Nodo(rs.getString(1), rs.getString(2), rs.getInt(3), rs.getInt(4),
                            Nodo.Tipo.valueOf(rs.getString(5))));
                }
            }
            try (ResultSet rs = st.executeQuery("SELECT a, b, metros, riesgo FROM arista ORDER BY orden")) {
                while (rs.next()) {
                    g.agregarArista(new Arista(rs.getString(1), rs.getString(2), rs.getDouble(3), rs.getDouble(4)));
                }
            }
            if (g.nodos().isEmpty()) {
                throw new ErrorDeAlmacenamiento("La base de datos no tiene puntos del campus (tabla nodo vacía)");
            }
            return new MapaCampus(g, ancho, alto);
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento("No se pudo leer el mapa: " + e.getMessage(), e);
        }
    }
}
