package evacuacion.datos.bd;

import evacuacion.datos.ErrorDeAlmacenamiento;
import evacuacion.datos.RepositorioEmergencia;
import evacuacion.modelo.EstadoEmergencia;
import evacuacion.modelo.Restricciones;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Set;

/**
 * El estado de la emergencia y los bloqueos en PostgreSQL: sobreviven a un reinicio del servidor.
 * Los estudiantes consultan el estado cada 2,5 s, así que se guarda también una copia en memoria:
 * se lee de la base al arrancar y cada cambio se escribe primero en la base y después en la copia
 * (si la base falla, la copia no cambia). Supone UN solo servidor escribiendo.
 */
public class EmergenciaEnBD implements RepositorioEmergencia {

    private final ConexionBD bd;
    private volatile EstadoEmergencia actual;

    public EmergenciaEnBD(ConexionBD bd) {
        this.bd = bd;
        this.actual = leer();
    }

    @Override
    public EstadoEmergencia obtener() {
        return actual;
    }

    @Override
    public synchronized void guardar(EstadoEmergencia estado) {
        try (Connection c = bd.abrir()) {
            c.setAutoCommit(false);
            try {
                try (PreparedStatement p = c.prepareStatement(
                        "INSERT INTO estado (id, activa, version) VALUES (1, ?, ?) "
                        + "ON CONFLICT (id) DO UPDATE SET activa = EXCLUDED.activa, version = EXCLUDED.version")) {
                    p.setBoolean(1, estado.activa());
                    p.setLong(2, estado.version());
                    p.executeUpdate();
                }
                try (Statement st = c.createStatement()) {
                    st.executeUpdate("DELETE FROM bloqueo");
                }
                try (PreparedStatement p = c.prepareStatement("INSERT INTO bloqueo (tipo, clave) VALUES (?, ?)")) {
                    for (String id : estado.restricciones().nodos()) {
                        p.setString(1, "NODO");
                        p.setString(2, id);
                        p.addBatch();
                    }
                    for (String clave : estado.restricciones().aristas()) {
                        p.setString(1, "ARISTA");
                        p.setString(2, clave);
                        p.addBatch();
                    }
                    p.executeBatch();
                }
                c.commit();
            } catch (SQLException | RuntimeException e) {
                c.rollback();
                throw e;
            }
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento("No se pudo guardar el estado de la emergencia: " + e.getMessage(), e);
        }
        actual = estado;
    }

    private EstadoEmergencia leer() {
        try (Connection c = bd.abrir(); Statement st = c.createStatement()) {
            boolean activa = false;
            long version = 0;
            try (ResultSet rs = st.executeQuery("SELECT activa, version FROM estado WHERE id = 1")) {
                if (rs.next()) {
                    activa = rs.getBoolean(1);
                    version = rs.getLong(2);
                }
            }
            Set<String> nodos = new HashSet<>();
            Set<String> aristas = new HashSet<>();
            try (ResultSet rs = st.executeQuery("SELECT tipo, clave FROM bloqueo")) {
                while (rs.next()) {
                    ("NODO".equals(rs.getString(1)) ? nodos : aristas).add(rs.getString(2));
                }
            }
            return new EstadoEmergencia(activa, version, new Restricciones(nodos, aristas));
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento("No se pudo leer el estado de la emergencia: " + e.getMessage(), e);
        }
    }
}
