package evacuacion.datos.bd;

import evacuacion.datos.ErrorDeAlmacenamiento;
import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.Arista;
import evacuacion.modelo.MapaCampus;
import evacuacion.modelo.Nodo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Copia el mapa del campus a la base de datos la primera vez (cuando está vacía), tomándolo de otro
 * repositorio (el mapa en memoria). Así no hay que escribir los 47 puntos a mano en SQL.
 * Si la base ya tiene datos no hace nada: lo guardado en la base manda.
 */
public class CargadorInicial {

    private CargadorInicial() { }

    /** @return true si cargó el mapa, false si la base ya tenía uno. */
    public static boolean cargarSiVacia(ConexionBD bd, RepositorioMapa semilla) {
        try (Connection c = bd.abrir()) {
            c.setAutoCommit(false);
            try {
                if (hayNodos(c)) {
                    c.rollback();
                    return false;
                }
                insertar(c, semilla.obtener());
                c.commit();
                return true;
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento("No se pudo cargar el mapa inicial: " + e.getMessage(), e);
        }
    }

    private static boolean hayNodos(Connection c) throws SQLException {
        try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM nodo")) {
            rs.next();
            return rs.getLong(1) > 0;
        }
    }

    private static void insertar(Connection c, MapaCampus mapa) throws SQLException {
        try (PreparedStatement p = c.prepareStatement(
                "INSERT INTO plano (id, ancho, alto) VALUES (1, ?, ?) ON CONFLICT DO NOTHING")) {
            p.setInt(1, mapa.ancho());
            p.setInt(2, mapa.alto());
            p.executeUpdate();
        }
        try (PreparedStatement p = c.prepareStatement(
                "INSERT INTO nodo (id, nombre, x, y, tipo, orden) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING")) {
            int orden = 0;
            for (Nodo n : mapa.grafo().nodos()) {
                p.setString(1, n.id);
                p.setString(2, n.nombre);
                p.setInt(3, n.x);
                p.setInt(4, n.y);
                p.setString(5, n.tipo.name());
                p.setInt(6, orden++);
                p.addBatch();
            }
            p.executeBatch();
        }
        try (PreparedStatement p = c.prepareStatement(
                "INSERT INTO arista (a, b, metros, riesgo, orden) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING")) {
            int orden = 0;
            for (Arista a : mapa.grafo().aristas()) {
                p.setString(1, a.a);
                p.setString(2, a.b);
                p.setDouble(3, a.metros);
                p.setDouble(4, a.riesgo);
                p.setInt(5, orden++);
                p.addBatch();
            }
            p.executeBatch();
        }
    }
}
