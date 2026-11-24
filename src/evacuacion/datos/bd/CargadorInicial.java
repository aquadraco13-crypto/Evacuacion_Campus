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
 * Copia el mapa del campus a la base de datos, tomándolo de otro repositorio (el mapa en memoria).
 * Así no hay que escribir los puntos a mano en SQL.
 * Si la base está vacía lo carga. Si ya tiene un mapa igual (mismos puntos, posiciones y caminos) no
 * hace nada. Al actualizar el plano conserva los bloqueos cuyos puntos y caminos siguen existiendo.
 */
public class CargadorInicial {

    private CargadorInicial() { }

    /** @return true si cargó o reemplazó el mapa, false si la base ya tenía el mismo. */
    public static boolean cargarSiVacia(ConexionBD bd, RepositorioMapa semilla) {
        try (Connection c = bd.abrir()) {
            c.setAutoCommit(false);
            try {
                MapaCampus mapa = semilla.obtener();
                boolean actualizar = hayNodos(c);
                if (actualizar) {
                    if (firma(c).equals(firma(mapa))) {
                        c.rollback();
                        return false;
                    }
                    try (Statement st = c.createStatement()) {
                        st.execute("LOCK TABLE estado, bloqueo IN SHARE ROW EXCLUSIVE MODE");
                    }
                    vaciar(c);
                }
                insertar(c, mapa);
                if (actualizar) {
                    try (Statement st = c.createStatement()) {
                        st.executeUpdate("DELETE FROM bloqueo b WHERE tipo = 'NODO' "
                                + "AND NOT EXISTS (SELECT 1 FROM nodo n WHERE n.id = b.clave)");
                        st.executeUpdate("DELETE FROM bloqueo b WHERE tipo = 'ARISTA' AND NOT EXISTS "
                                + "(SELECT 1 FROM arista a WHERE a.a || '|' || a.b = b.clave "
                                + "OR a.b || '|' || a.a = b.clave)");
                        st.executeUpdate("UPDATE estado SET version = version + 1 WHERE id = 1");
                    }
                }
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

    /** Resumen del mapa guardado: puntos con su posición y caminos, en orden estable. */
    private static String firma(Connection c) throws SQLException {
        java.util.TreeSet<String> partes = new java.util.TreeSet<>();
        try (Statement st = c.createStatement()) {
            try (ResultSet rs = st.executeQuery("SELECT ancho, alto FROM plano")) {
                while (rs.next()) partes.add("P:" + rs.getInt(1) + "x" + rs.getInt(2));
            }
            try (ResultSet rs = st.executeQuery("SELECT id, x, y, tipo FROM nodo")) {
                while (rs.next()) partes.add("N:" + rs.getString(1) + "," + rs.getInt(2) + "," + rs.getInt(3) + "," + rs.getString(4));
            }
            try (ResultSet rs = st.executeQuery("SELECT a, b, riesgo FROM arista")) {
                while (rs.next()) partes.add("A:" + rs.getString(1) + "-" + rs.getString(2) + "," + rs.getDouble(3));
            }
        }
        return String.join("|", partes);
    }

    private static String firma(MapaCampus mapa) {
        java.util.TreeSet<String> partes = new java.util.TreeSet<>();
        partes.add("P:" + mapa.ancho() + "x" + mapa.alto());
        for (Nodo n : mapa.grafo().nodos()) partes.add("N:" + n.id + "," + n.x + "," + n.y + "," + n.tipo.name());
        for (Arista a : mapa.grafo().aristas()) partes.add("A:" + a.a + "-" + a.b + "," + a.riesgo);
        return String.join("|", partes);
    }

    /** Retira la geometría anterior en el orden exigido por las claves externas. */
    private static void vaciar(Connection c) throws SQLException {
        try (Statement st = c.createStatement()) {
            st.executeUpdate("DELETE FROM arista");
            st.executeUpdate("DELETE FROM nodo");
            st.executeUpdate("DELETE FROM plano");
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
