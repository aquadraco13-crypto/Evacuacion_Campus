package evacuacion.datos.clave;

import java.util.Optional;

/** Lee la clave de una variable de entorno (por ejemplo ADMIN_CLAVE en un hosting). */
public class ClaveDeEntorno implements ProveedorClave {

    private final String variable;

    public ClaveDeEntorno(String variable) {
        this.variable = variable;
    }

    @Override
    public Optional<String> obtener() {
        String v = System.getenv(variable);
        return v == null || v.isBlank() ? Optional.empty() : Optional.of(v);
    }

    @Override
    public String origen() {
        return "variable de entorno " + variable;
    }
}
