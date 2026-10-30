import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.Executors;


public class Servidor {

    public static void main(String[] args) throws IOException {
        // Puerto: argumento, o variable PORT (la usan los hostings), o 8080
        String env = System.getenv("PORT");
        int puerto = args.length > 0 ? Integer.parseInt(args[0])
                : env != null && !env.isBlank() ? Integer.parseInt(env.trim()) : 8080;
        Path web = resolverWeb(args.length > 1 ? args[1] : null);
        if (!Files.isRegularFile(web.resolve("index.html"))) {
            System.out.println("ATENCION: no se encontro index.html en " + web);
            System.out.println("Pasa la ruta de la carpeta web como segundo argumento.");
        }
        Grafo campus = Campus.crear();
        Estado estado = new Estado(campus);
        Sesiones sesiones = new Sesiones(cargarClave(web));

        HttpServer server = HttpServer.create(new InetSocketAddress(puerto), 0);

        // ---- Público: el mapa del campus ----
        server.createContext("/api/campus", ex -> {
            if (!soloGet(ex)) return;
            responder(ex, 200, JSON, campusJson(campus));
        });

        // ---- Público: estado de la emergencia (los estudiantes lo consultan cada pocos segundos) ----
        server.createContext("/api/estado", ex -> {
            if (!soloGet(ex)) return;
            String json = estado.foto().toJson();
            json = json.substring(0, json.length() - 1) + ",\"admin\":" + esAdmin(ex, sesiones) + "}";
            responder(ex, 200, JSON, json);
        });

        // ---- Ruta: usa SIEMPRE los bloqueos del servidor. Sin emergencia, solo los admin pueden verla ----
        server.createContext("/api/ruta", ex -> {
            if (!soloGet(ex)) return;
            try {
                Estado.Foto f = estado.foto();
                if (!f.emergencia() && !esAdmin(ex, sesiones)) {
                    responder(ex, 200, JSON,
                            "{\"ok\":false,\"inactiva\":true,\"mensaje\":"
                                    + Json.str("No hay ninguna emergencia activa.") + ",\"opciones\":[]}");
                    return;
                }
                Map<String, String> q = parametros(ex.getRequestURI());
                Evacuacion.Plan plan = Evacuacion.calcular(campus, q.get("origen"), f.nodos(), f.aristas());
                responder(ex, 200, JSON, plan.toJson());
            } catch (RuntimeException e) {
                responder(ex, 500, JSON,
                        "{\"ok\":false,\"mensaje\":" + Json.str("Error interno.") + "}");
            }
        });

        // ---- Administradores ----
        server.createContext("/api/login", ex -> {
            Map<String, String> form = leerForm(ex);
            if (form == null) return;
            String ip = ipCliente(ex);
            Sesiones.Intento r = sesiones.iniciar(form.get("clave"), ip);
            switch (r.resultado()) {
                case OK -> {
                    ex.getResponseHeaders().add("Set-Cookie", COOKIE + "=" + r.token()
                            + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + (Sesiones.DURACION_MS / 1000)
                            + (conHttps(ex) ? "; Secure" : ""));
                    responder(ex, 200, JSON, "{\"ok\":true}");
                }
                case BLOQUEADA -> responder(ex, 429, JSON, "{\"ok\":false,\"mensaje\":"
                        + Json.str("Demasiados intentos. Espera un minuto e intenta de nuevo.") + "}");
                default -> responder(ex, 401, JSON, "{\"ok\":false,\"mensaje\":"
                        + Json.str("Clave incorrecta.") + "}");
            }
        });

        server.createContext("/api/logout", ex -> {
            if (leerForm(ex) == null) return;
            sesiones.cerrar(cookie(ex, COOKIE));
            ex.getResponseHeaders().add("Set-Cookie",
                    COOKIE + "=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
            responder(ex, 200, JSON, "{\"ok\":true}");
        });

        server.createContext("/api/admin/emergencia", ex -> {
            Map<String, String> form = leerForm(ex);
            if (form == null || !exigirAdmin(ex, sesiones)) return;
            String v = form.get("activa");
            if (!"true".equals(v) && !"false".equals(v)) {
                responder(ex, 400, JSON, "{\"ok\":false,\"mensaje\":\"Parámetro inválido.\"}");
                return;
            }
            estado.fijarEmergencia(Boolean.parseBoolean(v));
            responder(ex, 200, JSON, estado.foto().toJson());
        });

        server.createContext("/api/admin/bloqueos", ex -> {
            Map<String, String> form = leerForm(ex);
            if (form == null || !exigirAdmin(ex, sesiones)) return;
            boolean bien = estado.fijarBloqueos(lista(form.get("nodos")), lista(form.get("aristas")));
            if (!bien) {
                responder(ex, 400, JSON, "{\"ok\":false,\"mensaje\":\"Bloqueo inválido.\"}");
                return;
            }
            responder(ex, 200, JSON, estado.foto().toJson());
        });

        server.createContext("/", ex -> {
            if (!soloGet(ex)) return;
            servirArchivo(ex, web);
        });

        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();
        System.out.println("Sistema de evacuación listo en http://localhost:" + puerto);
        System.out.println("Carpeta web: " + web);
        System.out.println("Estudiantes:     http://localhost:" + puerto + "/");
        System.out.println("Administradores: http://localhost:" + puerto + "/admin.html");
    }

    static final String JSON = "application/json; charset=utf-8";
    static final String COOKIE = "sesion";
    static final int MAX_CUERPO = 4096;
    static final int CLAVE_MIN = 8;
    // Sin 0/O/1/l/I para que sea fácil de copiar
    static final String ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    /**
     * La clave de admin se busca en este orden:
     * 1) admin.properties (en la carpeta del proyecto, junto a "web"), línea clave=...
     * 2) variable de entorno ADMIN_CLAVE
     * 3) si no hay ninguna, se inventa una al azar y se muestra en la consola.
     */
    static String cargarClave(Path web) {
        String clave = null;
        Path archivo = web.getParent() == null ? null : web.getParent().resolve("admin.properties");
        if (archivo != null && Files.isRegularFile(archivo)) {
            Properties p = new Properties();
            try (InputStream in = Files.newInputStream(archivo)) {
                p.load(new java.io.InputStreamReader(in, StandardCharsets.UTF_8));
                clave = p.getProperty("clave");
            } catch (IOException e) {
                System.out.println("No se pudo leer admin.properties: " + e.getMessage());
            }
        }
        if (clave == null || clave.isBlank()) clave = System.getenv("ADMIN_CLAVE");
        if (clave != null && !clave.isBlank()) {
            if (clave.length() >= CLAVE_MIN) {
                System.out.println("Clave de administrador cargada (no se muestra).");
                return clave;
            }
            System.out.println("ATENCION: la clave configurada tiene menos de " + CLAVE_MIN
                    + " caracteres, se ignora.");
        }
        SecureRandom azar = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) sb.append(ALFABETO.charAt(azar.nextInt(ALFABETO.length())));
        System.out.println("No hay clave configurada. Clave de administrador de ESTA ejecución: " + sb);
        System.out.println("Para fijar una clave propia, escríbela en admin.properties (clave=...).");
        return sb.toString();
    }

    // En un hosting hay un proxy delante: todas las visitas llegan "desde el proxy".
    // Con TRUST_PROXY=1 se usa la IP real que el proxy informa en X-Forwarded-For.
    static final boolean CONFIAR_PROXY = "1".equals(System.getenv("TRUST_PROXY"));

    static String ipCliente(HttpExchange ex) {
        if (CONFIAR_PROXY) {
            String xff = ex.getRequestHeaders().getFirst("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        }
        return ex.getRemoteAddress().getAddress().getHostAddress();
    }

    static boolean conHttps(HttpExchange ex) {
        return CONFIAR_PROXY && "https".equalsIgnoreCase(ex.getRequestHeaders().getFirst("X-Forwarded-Proto"));
    }

    /** Lee una cookie por nombre. */
    static String cookie(HttpExchange ex, String nombre) {
        for (String linea : ex.getRequestHeaders().getOrDefault("Cookie", java.util.List.of())) {
            for (String par : linea.split(";")) {
                String t = par.trim();
                if (t.startsWith(nombre + "=")) return t.substring(nombre.length() + 1);
            }
        }
        return null;
    }

    static boolean esAdmin(HttpExchange ex, Sesiones sesiones) {
        return sesiones.valida(cookie(ex, COOKIE));
    }

    static boolean exigirAdmin(HttpExchange ex, Sesiones sesiones) throws IOException {
        if (esAdmin(ex, sesiones)) return true;
        responder(ex, 401, JSON, "{\"ok\":false,\"mensaje\":\"Solo administradores.\"}");
        return false;
    }

    /**
     * Valida una petición POST (método, origen del navegador, tamaño) y devuelve el formulario.
     * Si algo falla, ya respondió el error y devuelve null.
     */
    static Map<String, String> leerForm(HttpExchange ex) throws IOException {
        if (!"POST".equals(ex.getRequestMethod())) {
            responder(ex, 405, "text/plain; charset=utf-8", "Método no permitido");
            return null;
        }
        String origen = ex.getRequestHeaders().getFirst("Origin");
        String host = ex.getRequestHeaders().getFirst("Host");
        if (origen != null) {
            String sinEsquema = origen.replaceFirst("^https?://", "");
            if (host == null || !sinEsquema.equalsIgnoreCase(host)) {
                responder(ex, 403, "text/plain; charset=utf-8", "Origen no permitido");
                return null;
            }
        }
        byte[] cuerpo;
        try (InputStream in = ex.getRequestBody()) {
            cuerpo = in.readNBytes(MAX_CUERPO + 1);
        }
        if (cuerpo.length > MAX_CUERPO) {
            responder(ex, 413, "text/plain; charset=utf-8", "Cuerpo demasiado grande");
            return null;
        }
        return parseForm(new String(cuerpo, StandardCharsets.UTF_8));
    }

    
    static Path resolverWeb(String indicada) {
        if (indicada != null) return Paths.get(indicada).toAbsolutePath().normalize();
        Path actual = Paths.get("").toAbsolutePath();
        for (int i = 0; i < 4 && actual != null; i++, actual = actual.getParent()) {
            Path candidata = actual.resolve("web");
            if (Files.isRegularFile(candidata.resolve("index.html"))) return candidata.normalize();
        }
        return Paths.get("web").toAbsolutePath().normalize();
    }

    //  API

    static String campusJson(Grafo g) {
        StringBuilder sb = new StringBuilder("{");
        sb.append("\"ancho\":").append(Campus.ANCHO).append(",\"alto\":").append(Campus.ALTO);
        sb.append(",\"velocidadMs\":").append(Evacuacion.VELOCIDAD_MS);

        sb.append(",\"nodos\":[");
        boolean primero = true;
        for (Nodo n : g.nodos()) {
            if (!primero) sb.append(',');
            primero = false;
            sb.append("{\"id\":").append(Json.str(n.id));
            sb.append(",\"nombre\":").append(Json.str(n.nombre));
            sb.append(",\"x\":").append(n.x).append(",\"y\":").append(n.y);
            sb.append(",\"tipo\":").append(Json.str(n.tipo.name())).append('}');
        }

        sb.append("],\"aristas\":[");
        primero = true;
        for (Arista ar : g.aristas()) {
            if (!primero) sb.append(',');
            primero = false;
            sb.append("{\"a\":").append(Json.str(ar.a));
            sb.append(",\"b\":").append(Json.str(ar.b));
            sb.append(",\"metros\":").append(Json.num(ar.metros));
            sb.append(",\"riesgo\":").append(Json.num(ar.riesgo));
            sb.append(",\"clave\":").append(Json.str(ar.clave())).append('}');
        }
        return sb.append("]}").toString();
    }

    // Utilidades

    static Map<String, String> parametros(URI uri) {
        return parseForm(uri.getRawQuery());
    }

    static Map<String, String> parseForm(String q) {
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

    static Set<String> lista(String csv) {
        Set<String> out = new HashSet<>();
        if (csv == null || csv.isBlank()) return out;
        for (String p : csv.split(",")) {
            if (!p.isBlank()) out.add(p.trim());
        }
        return out;
    }

    static boolean soloGet(HttpExchange ex) throws IOException {
        if ("GET".equals(ex.getRequestMethod())) return true;
        responder(ex, 405, "text/plain; charset=utf-8", "Método no permitido");
        return false;
    }

    static void responder(HttpExchange ex, int codigo, String tipo, String cuerpo) throws IOException {
        responder(ex, codigo, tipo, cuerpo.getBytes(StandardCharsets.UTF_8));
    }

    static void responder(HttpExchange ex, int codigo, String tipo, byte[] cuerpo) throws IOException {
        ex.getResponseHeaders().set("Content-Type", tipo);
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        ex.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        ex.getResponseHeaders().set("X-Frame-Options", "DENY");
        ex.getResponseHeaders().set("Referrer-Policy", "no-referrer");
        ex.getResponseHeaders().set("Content-Security-Policy",
                "default-src 'self'; style-src 'self' https://fonts.googleapis.com; "
                + "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; "
                + "frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
        ex.sendResponseHeaders(codigo, cuerpo.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(cuerpo);
        }
    }

    static void servirArchivo(HttpExchange ex, Path web) throws IOException {
        String ruta = ex.getRequestURI().getPath();
        if (ruta.equals("/")) ruta = "/index.html";
        if (ruta.equals("/admin")) ruta = "/admin.html";
        Path archivo = web.resolve(ruta.substring(1)).normalize();

        
        if (!archivo.startsWith(web) || !Files.isRegularFile(archivo)) {
            responder(ex, 404, "text/plain; charset=utf-8", "No encontrado");
            return;
        }
        responder(ex, 200, tipoMime(archivo.getFileName().toString()), Files.readAllBytes(archivo));
    }

    static String tipoMime(String nombre) {
        if (nombre.endsWith(".html")) return "text/html; charset=utf-8";
        if (nombre.endsWith(".css")) return "text/css; charset=utf-8";
        if (nombre.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (nombre.endsWith(".json")) return "application/json; charset=utf-8";
        if (nombre.endsWith(".svg")) return "image/svg+xml";
        if (nombre.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }
}