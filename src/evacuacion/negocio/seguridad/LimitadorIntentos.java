package evacuacion.negocio.seguridad;

import java.util.HashMap;
import java.util.Map;
import java.util.function.LongSupplier;

/** Frena la fuerza bruta: tras N fallos seguidos desde una misma IP, la bloquea un tiempo. */
public class LimitadorIntentos {

    private static final class Fallos {
        int cantidad;
        long hasta;
    }

    private final LongSupplier reloj;
    private final int maximo;
    private final long bloqueoMs;
    private final Map<String, Fallos> porIp = new HashMap<>();

    public LimitadorIntentos(LongSupplier reloj, int maximo, long bloqueoMs) {
        this.reloj = reloj;
        this.maximo = maximo;
        this.bloqueoMs = bloqueoMs;
    }

    public synchronized boolean bloqueada(String ip) {
        Fallos f = porIp.get(ip);
        return f != null && f.hasta > reloj.getAsLong();
    }

    public synchronized void registrarFallo(String ip) {
        long ahora = reloj.getAsLong();
        Fallos f = porIp.computeIfAbsent(ip, k -> new Fallos());
        f.cantidad++;
        if (f.cantidad >= maximo) {
            f.hasta = ahora + bloqueoMs;
            f.cantidad = 0;
        }
    }

    public synchronized void registrarExito(String ip) {
        porIp.remove(ip);
        long ahora = reloj.getAsLong();
        porIp.values().removeIf(f -> f.cantidad == 0 && f.hasta <= ahora);
    }
}
