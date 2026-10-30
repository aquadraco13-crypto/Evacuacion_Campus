
public class Campus {

    public static final int ANCHO = 1200;
    public static final int ALTO  = 780;

    private static final Nodo.Tipo SALON   = Nodo.Tipo.SALON;
    private static final Nodo.Tipo PASILLO = Nodo.Tipo.PASILLO;
    private static final Nodo.Tipo SALIDA  = Nodo.Tipo.SALIDA;
    private static final Nodo.Tipo PE      = Nodo.Tipo.PUNTO_ENCUENTRO;

    public static Grafo crear() {
        Grafo g = new Grafo();

        // ----- NORTE -----
        g.agregarNodo(new Nodo("COM",    "Comedor",           80,  80, SALON));
        g.agregarNodo(new Nodo("SCOM",   "Puerta Comedor",   120, 130, SALIDA));
        g.agregarNodo(new Nodo("FUENTE", "Fuente UPC",       260,  60, PASILLO));
        g.agregarNodo(new Nodo("H1",     "Bloque H",         400,  80, SALON));
        g.agregarNodo(new Nodo("SH",     "Puerta Bloque H",  400, 135, SALIDA));

        // ----- NÚCLEO: C/D arriba, E, A/B abajo -----
        g.agregarNodo(new Nodo("C1", "Salón C-101", 150, 200, SALON));
        g.agregarNodo(new Nodo("C2", "Salón C-102", 220, 200, SALON));
        g.agregarNodo(new Nodo("PC", "Pasillo C",   185, 245, PASILLO));
        g.agregarNodo(new Nodo("SC", "Puerta C",    240, 270, SALIDA));

        g.agregarNodo(new Nodo("D1", "Salón D-101", 300, 200, SALON));
        g.agregarNodo(new Nodo("D2", "Salón D-102", 370, 200, SALON));
        g.agregarNodo(new Nodo("PD", "Pasillo D",   335, 245, PASILLO));
        g.agregarNodo(new Nodo("SD", "Puerta D",    380, 270, SALIDA));

        g.agregarNodo(new Nodo("E",  "Pasillo E",   270, 310, PASILLO));

        g.agregarNodo(new Nodo("A1", "Salón A-101", 150, 370, SALON));
        g.agregarNodo(new Nodo("A2", "Salón A-102", 220, 370, SALON));
        g.agregarNodo(new Nodo("PA", "Pasillo A",   185, 415, PASILLO));
        g.agregarNodo(new Nodo("SA", "Puerta A",    240, 445, SALIDA));

        g.agregarNodo(new Nodo("B1", "Salón B-101", 300, 370, SALON));
        g.agregarNodo(new Nodo("B2", "Salón B-102", 370, 370, SALON));
        g.agregarNodo(new Nodo("PB", "Pasillo B",   335, 415, PASILLO));
        g.agregarNodo(new Nodo("SB", "Puerta B",    380, 445, SALIDA));

        // CAF núcleo (separada a la izquierda)
        g.agregarNodo(new Nodo("CAF1",  "Cafetería",         60, 280, SALON));
        g.agregarNodo(new Nodo("SCAF1", "Puerta Cafetería", 105, 310, SALIDA));

        // ----- CENTRO / I / P+Labs / CAF2 arriba -----
        g.agregarNodo(new Nodo("CENTRO", "Centro",           520, 250, PASILLO));
        g.agregarNodo(new Nodo("PLAZA",  "Plaza central",    520, 380, PASILLO));

        // I delante
        g.agregarNodo(new Nodo("I1", "Bloque I",        600, 180, SALON));
        g.agregarNodo(new Nodo("SI", "Puerta Bloque I", 600, 235, SALIDA));

        // CAF2 ARRIBA entre I y P
        g.agregarNodo(new Nodo("CAF2",  "Cafetería I-P",     680, 140, SALON));
        g.agregarNodo(new Nodo("SCAF2", "Puerta CAF I-P",    680, 185, SALIDA));

        // P + Labs (mismo edificio)
        g.agregarNodo(new Nodo("P1",   "Bloque P",          760, 180, SALON));
        g.agregarNodo(new Nodo("SP",   "Puerta Bloque P",   760, 235, SALIDA));
        g.agregarNodo(new Nodo("LAB1", "Lab. Sistemas",     740, 280, SALON));
        g.agregarNodo(new Nodo("LAB2", "Lab. Física",       800, 290, SALON));
        g.agregarNodo(new Nodo("PLAB", "Pasillo Labs",      770, 255, PASILLO));

        // ----- ESTE: Académico + Entrada principal (bien visibles) -----
        g.agregarNodo(new Nodo("ADM",   "Académico-Administrativo", 1080, 260, SALON));
        g.agregarNodo(new Nodo("SADM",  "Puerta Académico",         1020, 310, SALIDA));
        g.agregarNodo(new Nodo("ENTRA", "Entrada principal",        1120, 380, SALIDA));

        // ----- SUR: un solo bloque Biblio+Registro+Aud -----
        g.agregarNodo(new Nodo("BIB",  "Biblioteca",         560, 600, SALON));
        g.agregarNodo(new Nodo("REG",  "Registro y Control", 640, 620, SALON));
        g.agregarNodo(new Nodo("AUD",  "Auditorio",          720, 600, SALON));
        g.agregarNodo(new Nodo("SSUR", "Puerta bloque sur",  640, 540, SALIDA));

        // ----- ENTRADA LATERAL (oeste, visible) -----
        g.agregarNodo(new Nodo("LATERAL", "Entrada lateral",  50, 480, SALIDA));

        // ----- PE alejados del centro -----
        g.agregarNodo(new Nodo("PE_SUR_B", "PE Sur Bloque B",          320, 560, PE));
        g.agregarNodo(new Nodo("PE_ESTE",  "PE Este",                  920, 200, PE));
        g.agregarNodo(new Nodo("PE_SO",    "PE Sur-Oeste",             200, 650, PE));
        g.agregarNodo(new Nodo("PE_NORTE", "PE Norte",                 260,  30, PE));

        // ===== CONEXIONES =====
        g.conectar("COM", "SCOM");
        g.conectar("SCOM", "FUENTE");
        g.conectar("FUENTE", "SH");
        g.conectar("H1", "SH");
        g.conectar("SH", "CENTRO");
        g.conectar("FUENTE", "PE_NORTE");
        g.conectar("SCOM", "SCAF1");

        g.conectar("C1", "PC"); g.conectar("C2", "PC"); g.conectar("PC", "SC");
        g.conectar("D1", "PD"); g.conectar("D2", "PD"); g.conectar("PD", "SD");
        g.conectar("PC", "PD");
        g.conectar("SC", "E"); g.conectar("SD", "E");

        g.conectar("E", "PA"); g.conectar("E", "PB"); g.conectar("E", "CENTRO");

        g.conectar("A1", "PA"); g.conectar("A2", "PA"); g.conectar("PA", "SA");
        g.conectar("B1", "PB"); g.conectar("B2", "PB"); g.conectar("PB", "SB");
        g.conectar("PA", "PB");
        g.conectar("SA", "PLAZA"); g.conectar("SB", "PLAZA");
        g.conectar("SB", "PE_SUR_B"); g.conectar("SA", "PE_SUR_B");

        g.conectar("CAF1", "SCAF1");
        g.conectar("SCAF1", "PC"); g.conectar("SCAF1", "E"); g.conectar("SCAF1", "LATERAL");

        g.conectar("CENTRO", "PLAZA");
        g.conectar("PLAZA", "SSUR");

        g.conectar("I1", "SI"); g.conectar("P1", "SP");
        g.conectar("SI", "CENTRO"); g.conectar("SI", "SP");
        g.conectar("SP", "PLAB");
        g.conectar("LAB1", "PLAB"); g.conectar("LAB2", "PLAB");
        g.conectar("PLAB", "PLAZA");

        g.conectar("CAF2", "SCAF2");
        g.conectar("SCAF2", "SI"); g.conectar("SCAF2", "SP");

        g.conectar("ADM", "SADM");
        g.conectar("SADM", "ENTRA");
        g.conectar("SP", "PE_ESTE");
        g.conectar("PE_ESTE", "SADM");
        g.conectar("CENTRO", "SADM", 1.4);

        g.conectar("BIB", "SSUR"); g.conectar("REG", "SSUR"); g.conectar("AUD", "SSUR");
        g.conectar("SSUR", "PE_SO");

        g.conectar("LATERAL", "SCAF1");
        g.conectar("LATERAL", "SA");
        g.conectar("LATERAL", "PE_SO");
        g.conectar("LATERAL", "PE_SUR_B");

        return g;
    }
}
