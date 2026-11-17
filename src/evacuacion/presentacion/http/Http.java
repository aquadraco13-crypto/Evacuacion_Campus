package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Utilidades HTTP compartidas por los controladores: responder, leer formularios, cookies, IP. */
public final class Http {

    public static final String JSON = "application/json; charset=utf-8";
    public static final String TEXTO = "text/plain; charset=utf-8";
    static final int MAX_CUERPO = 4096;

    // En un hosting hay un proxy delante: todas las visitas llegan "desde el proxy".
    // Con TRUST_PROXY=1 se usa la IP real que el proxy informa en X-Forwarded-For.
    static final boolean CONFIAR_PROXY = "1".equals(System.getenv("TRUST_PROXY"));

    private Http() { }

    public static void responder(HttpExchange ex, int codigo, String tipo, String cuerpo) throws IOException {
        responder(ex, codigo, tipo, cuerpo.getBytes(StandardCharsets.UTF_8));
    }

    public static void responder(HttpExchange ex, int codigo, String tipo, byte[] cuerpo) throws IOException {
        var h = ex.getResponseHeaders();
        h.set("Content-Type", tipo);
        h.set("Cache-Control", "no-store");
        h.set("X-Content-Type-Options", "nosniff");
        h.set("X-Frame-Options", "DENY");
        h.set("Referrer-Policy", "no-referrer");
        h.set("Content-Security-Policy",
                "default-src 'self'; style-src 'self' https://fonts.googleapis.com; "
                + "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; "
                + "frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        ex.sendResponseHeaders(codigo, cuerpo.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(cuerpo);
        }
    }

    public static boolean soloGet(HttpExchange ex) throws IOException {
        if ("GET".equals(ex.getRequestMethod())) return true;
        responder(ex, 405, TEXTO, "Método no permitido");
        return false;
    }

    /**
     * Valida una petición POST (método, origen del navegador, tamaño) y devuelve el formulario.
     * Si algo falla, ya respondió el error y devuelve null.
     */
    public static Map<String, String> leerForm(HttpExchange ex) throws IOException {
        if (!"POST".equals(ex.getRequestMethod())) {
            responder(ex, 405, TEXTO, "Método no permitido");
            return null;
        }
        String origen = ex.getRequestHeaders().getFirst("Origin");
        String host = ex.getRequestHeaders().getFirst("Host");
        if (origen != null) {
            String sinEsquema = origen.replaceFirst("^https?://", "");
            if (host == null || !sinEsquema.equalsIgnoreCase(host)) {
                responder(ex, 403, TEXTO, "Origen no permitido");
                return null;
            }
        }
        byte[] cuerpo;
        try (InputStream in = ex.getRequestBody()) {
            cuerpo = in.readNBytes(MAX_CUERPO + 1);
        }
        if (cuerpo.length > MAX_CUERPO) {
            responder(ex, 413, TEXTO, "Cuerpo demasiado grande");
            return null;
        }
        return parseForm(new String(cuerpo, StandardCharsets.UTF_8));
    }

    public static Map<String, String> parametros(URI uri) {
        return parseForm(uri.getRawQuery());
    }

    public static Map<String, String> parseForm(String q) {
        Map<String, String> m = new HashMap<>();
        if (q == null || q.isEmpty()) return m;
        for (String par : q.split("&")) {
            int i = par.indexOf('=');
            String k = i < 0 ? par : par.substring(0, i);
            String v = i < 0 ? "" : par.substring(i + 1);
            m.put(URLDecoder.decode(k, StandardCharsets.UTF_8), URLDecoder.decode(v, StandardCharsets.UTF_8));
        }
        return m;
    }

    /** "a,b,c" -> {a, b, c} */
    public static java.util.Set<String> lista(String csv) {
        java.util.Set<String> out = new java.util.HashSet<>();
        if (csv == null || csv.isBlank()) return out;
        for (String p : csv.split(",")) {
            if (!p.isBlank()) out.add(p.trim());
        }
        return out;
    }

    public static String cookie(HttpExchange ex, String nombre) {
        for (String linea : ex.getRequestHeaders().getOrDefault("Cookie", List.of())) {
            for (String par : linea.split(";")) {
                String t = par.trim();
                if (t.startsWith(nombre + "=")) return t.substring(nombre.length() + 1);
            }
        }
        return null;
    }

    public static String ipCliente(HttpExchange ex) {
        if (CONFIAR_PROXY) {
            String xff = ex.getRequestHeaders().getFirst("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        }
        return ex.getRemoteAddress().getAddress().getHostAddress();
    }

    public static boolean conHttps(HttpExchange ex) {
        return CONFIAR_PROXY && "https".equalsIgnoreCase(ex.getRequestHeaders().getFirst("X-Forwarded-Proto"));
    }
}
