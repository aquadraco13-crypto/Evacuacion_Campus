package evacuacion.datos.bd;

import evacuacion.datos.ErrorDeAlmacenamiento;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

/**
 * Abre conexiones a PostgreSQL y crea las tablas la primera vez.
 * GRASP Fabricación pura: no existe en el campus; se creó para que los repositorios no repitan
 * el código de conexión. Se abre una conexión por operación (son pocas y rápidas); cada una se cierra sola.
 */
public class ConexionBD {

    private final ConfiguracionBD config;

    public ConexionBD(ConfiguracionBD config) {
        this.config = config;
    }

    public ConfiguracionBD config() {
        return config;
    }

    public Connection abrir() {
        Properties p = new Properties();
        if (config.usuario() != null) p.setProperty("user", config.usuario());
        if (config.clave() != null) p.setProperty("password", config.clave());
        p.setProperty("connectTimeout", "10");
        p.setProperty("ApplicationName", "net-path-upc");
        try {
            return DriverManager.getConnection(config.jdbcUrl(), p);
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento(
                    "No se pudo conectar a " + config.descripcion() + ": " + e.getMessage(), e);
        }
    }

    /** Crea las tablas si no existen (se puede llamar en cada arranque). */
    public void crearTablas() {
        String[] sql = {
            "CREATE TABLE IF NOT EXISTS plano ("
                + " id INT PRIMARY KEY CHECK (id = 1),"
                + " ancho INT NOT NULL, alto INT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS nodo ("
                + " id TEXT PRIMARY KEY, nombre TEXT NOT NULL,"
                + " x INT NOT NULL, y INT NOT NULL,"
                + " tipo TEXT NOT NULL CHECK (tipo IN ('SALON','PASILLO','SALIDA','PUNTO_ENCUENTRO')),"
                + " orden INT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS arista ("
                + " a TEXT NOT NULL REFERENCES nodo(id), b TEXT NOT NULL REFERENCES nodo(id),"
                + " metros DOUBLE PRECISION NOT NULL CHECK (metros >= 0),"
                + " riesgo DOUBLE PRECISION NOT NULL CHECK (riesgo >= 0),"
                + " orden INT NOT NULL, PRIMARY KEY (a, b))",
            "CREATE TABLE IF NOT EXISTS estado ("
                + " id INT PRIMARY KEY CHECK (id = 1),"
                + " activa BOOLEAN NOT NULL, version BIGINT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS bloqueo ("
                + " tipo TEXT NOT NULL CHECK (tipo IN ('NODO','ARISTA')),"
                + " clave TEXT NOT NULL, PRIMARY KEY (tipo, clave))",
        };
        try (Connection c = abrir(); Statement st = c.createStatement()) {
            for (String s : sql) st.execute(s);
        } catch (SQLException e) {
            throw new ErrorDeAlmacenamiento("No se pudieron crear las tablas: " + e.getMessage(), e);
        }
    }
}
