package evacuacion.presentacion.http;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/** GET /...: entrega las páginas y archivos de la carpeta web (index.html, admin.html, app.js, ...). */
public class ArchivosControlador implements Controlador {

    private final Path web;

    public ArchivosControlador(Path web) {
        this.web = web;
    }

    @Override public String ruta() { return "/"; }

    @Override
    public void manejar(HttpExchange ex) throws IOException {
        if (!Http.soloGet(ex)) return;
        String ruta = ex.getRequestURI().getPath();
        if (ruta.equals("/")) ruta = "/index.html";
        if (ruta.equals("/admin")) ruta = "/admin.html";
        Path archivo = web.resolve(ruta.substring(1)).normalize();

        // No permitir salirse de la carpeta web (../)
        if (!archivo.startsWith(web) || !Files.isRegularFile(archivo)) {
            Http.responder(ex, 404, Http.TEXTO, "No encontrado");
            return;
        }
        Http.responder(ex, 200, tipoMime(archivo.getFileName().toString()), Files.readAllBytes(archivo));
    }

    /** Busca la carpeta web en la carpeta actual y hasta 3 carpetas más arriba. */
    public static Path resolverWeb(String indicada) {
        if (indicada != null) return Paths.get(indicada).toAbsolutePath().normalize();
        Path actual = Paths.get("").toAbsolutePath();
        for (int i = 0; i < 4 && actual != null; i++, actual = actual.getParent()) {
            Path candidata = actual.resolve("web");
            if (Files.isRegularFile(candidata.resolve("index.html"))) return candidata.normalize();
        }
        return Paths.get("web").toAbsolutePath().normalize();
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
