package evacuacion.datos.clave;

import java.util.Optional;

/**
 * Una fuente posible de la clave de administrador (archivo, variable de entorno...).
 * Contrato (SOLID L): si no tiene clave devuelve Optional.empty(); nunca lanza excepción ni devuelve texto vacío.
 * Así cualquier implementación se puede usar en lugar de otra.
 */
public interface ProveedorClave {

    Optional<String> obtener();

    /** Descripción corta de dónde se busca, para mensajes de la consola. */
    String origen();
}
