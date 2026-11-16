package evacuacion.datos.clave;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.Properties;

/** Lee la línea clave=... de un archivo .properties (admin.properties). */
public class ClaveDeArchivo implements ProveedorClave {

    private final Path archivo;

    public ClaveDeArchivo(Path archivo) {
        this.archivo = archivo;
    }

    @Override
    public Optional<String> obtener() {
        if (archivo == null || !Files.isRegularFile(archivo)) return Optional.empty();
        Properties p = new Properties();
        try (InputStream in = Files.newInputStream(archivo)) {
            p.load(new InputStreamReader(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            return Optional.empty();
        }
        String clave = p.getProperty("clave");
        return clave == null || clave.isBlank() ? Optional.empty() : Optional.of(clave);
    }

    @Override
    public String origen() {
        return "admin.properties";
    }
}
