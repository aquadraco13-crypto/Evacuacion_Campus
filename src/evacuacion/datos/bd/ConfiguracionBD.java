package evacuacion.datos.bd;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.function.Function;

/**
 * Datos para conectarse a PostgreSQL. Se leen de la variable de entorno DATABASE_URL, con el formato que
 * entregan los hostings (Render, Neon, Supabase, Railway...):
 *
 *     postgres://usuario:clave@servidor:5432/basededatos?sslmode=require
 *
 * También se acepta la forma de JDBC (jdbc:postgresql://servidor/base) con DB_USUARIO y DB_CLAVE aparte.
 * GRASP Alta cohesión: esta clase solo sabe interpretar esa dirección.
 */
public record ConfiguracionBD(String jdbcUrl, String usuario, String clave) {

    public static Optional<ConfiguracionBD> desdeEntorno(Function<String, String> entorno) {
        String url = entorno.apply("DATABASE_URL");
        if (url == null || url.isBlank()) return Optional.empty();
        return Optional.of(desde(url.trim(), entorno.apply("DB_USUARIO"), entorno.apply("DB_CLAVE")));
    }

    public static ConfiguracionBD desde(String url, String usuario, String clave) {
        if (url.startsWith("jdbc:postgresql:")) return new ConfiguracionBD(url, usuario, clave);
        if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
            throw new IllegalArgumentException(
                    "DATABASE_URL debe empezar por postgres://, postgresql:// o jdbc:postgresql://");
        }
        URI u;
        try {
            u = new URI(url);
        } catch (URISyntaxException e) {
            // No se copia el texto de la dirección al mensaje: puede traer la clave.
            throw new IllegalArgumentException(
                    "DATABASE_URL no es una dirección válida (si la clave tiene símbolos como @ o /, codifícalos, p. ej. @ = %40)");
        }
        if (u.getHost() == null) throw new IllegalArgumentException("DATABASE_URL no trae el servidor");
        String base = u.getPath() == null ? "" : u.getPath().replaceFirst("^/", "");
        if (base.isEmpty()) throw new IllegalArgumentException("DATABASE_URL no trae el nombre de la base de datos");

        String user = usuario;
        String pass = clave;
        if (u.getRawUserInfo() != null) {
            String[] partes = u.getRawUserInfo().split(":", 2);
            user = decodificar(partes[0]);
            if (partes.length > 1) pass = decodificar(partes[1]);
        }
        int puerto = u.getPort() < 0 ? 5432 : u.getPort();
        String jdbc = "jdbc:postgresql://" + u.getHost() + ":" + puerto + "/" + base
                + (u.getRawQuery() == null ? "" : "?" + u.getRawQuery());
        return new ConfiguracionBD(jdbc, user, pass);
    }

    /** Lo mismo pero usando otro esquema de la base (las pruebas lo usan para no tocar datos reales). */
    public ConfiguracionBD conEsquema(String esquema) {
        String sep = jdbcUrl.contains("?") ? "&" : "?";
        return new ConfiguracionBD(jdbcUrl + sep + "currentSchema=" + esquema, usuario, clave);
    }

    /** Servidor y base, sin usuario ni clave: sirve para mostrar en mensajes. */
    public String descripcion() {
        int q = jdbcUrl.indexOf('?');
        return q < 0 ? jdbcUrl : jdbcUrl.substring(0, q);
    }

    private static String decodificar(String s) {
        return URLDecoder.decode(s.replace("+", "%2B"), StandardCharsets.UTF_8);
    }

    /** Nunca imprime la clave. */
    @Override
    public String toString() {
        return "ConfiguracionBD[" + descripcion() + ", usuario=" + usuario + "]";
    }
}
