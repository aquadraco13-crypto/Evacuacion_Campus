import java.util.List;
import java.util.Locale;


final class Json {

    private Json() { }

    static String str(String s) {
        if (s == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }

    static String num(double d) {
        if (Double.isNaN(d) || Double.isInfinite(d)) return "null";
        return String.format(Locale.ROOT, "%.1f", d);
    }

    static String lista(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(str(items.get(i)));
        }
        return sb.append(']').toString();
    }
}
