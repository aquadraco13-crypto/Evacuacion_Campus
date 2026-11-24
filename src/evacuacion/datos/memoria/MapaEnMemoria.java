package evacuacion.datos.memoria;

import evacuacion.datos.RepositorioMapa;
import evacuacion.modelo.Grafo;
import evacuacion.modelo.MapaCampus;
import evacuacion.modelo.Nodo;

/**
 * Los datos del campus (puntos y caminos), escritos a mano en memoria.
 * Las posiciones salen del modelo 3D del campus: x = 2·u, y = 2·v, con (u, v) las coordenadas
 * del plano del modelo (cada unidad de plano mide 0,59 m).
 * GRASP Creador: esta clase arma el Grafo con sus Nodos y Aristas.
 * Para cambiar el plano solo se edita esta clase.
 */
public class MapaEnMemoria implements RepositorioMapa {


    private static final int ANCHO = 1124;
    private static final int ALTO  = 1032;

    private static final Nodo.Tipo SALON   = Nodo.Tipo.SALON;
    private static final Nodo.Tipo PASILLO = Nodo.Tipo.PASILLO;
    private static final Nodo.Tipo SALIDA  = Nodo.Tipo.SALIDA;
    private static final Nodo.Tipo PE      = Nodo.Tipo.PUNTO_ENCUENTRO;

    private final MapaCampus mapa = new MapaCampus(crear(), ANCHO, ALTO);

    @Override
    public MapaCampus obtener() {
        return mapa;
    }

    private static Grafo crear() {
        Grafo g = new Grafo();

        // ----- PUNTOS: salones, pasillos, puertas y puntos de encuentro -----
        g.agregarNodo(new Nodo("COM", "Comedor", 210, 230, SALON));
        g.agregarNodo(new Nodo("SCOM", "Puerta Comedor", 276, 256, SALIDA));
        g.agregarNodo(new Nodo("FUENTE", "Fuente del Bloque H", 328, 224, PASILLO));
        g.agregarNodo(new Nodo("H1", "Bloque H", 340, 176, SALON));
        g.agregarNodo(new Nodo("SH", "Puerta Bloque H", 352, 248, SALIDA));
        g.agregarNodo(new Nodo("N1", "Camino norte", 464, 280, PASILLO));
        g.agregarNodo(new Nodo("C1", "Salón C-101", 320, 320, SALON));
        g.agregarNodo(new Nodo("C2", "Salón C-102", 320, 380, SALON));
        g.agregarNodo(new Nodo("PC", "Pasillo C", 360, 350, PASILLO));
        g.agregarNodo(new Nodo("SC", "Puerta C", 448, 336, SALIDA));
        g.agregarNodo(new Nodo("D1", "Salón D-101", 392, 320, SALON));
        g.agregarNodo(new Nodo("D2", "Salón D-102", 392, 380, SALON));
        g.agregarNodo(new Nodo("PD", "Pasillo D", 416, 350, PASILLO));
        g.agregarNodo(new Nodo("SD", "Puerta D", 448, 392, SALIDA));
        g.agregarNodo(new Nodo("E", "Bloque E", 438, 458, PASILLO));
        g.agregarNodo(new Nodo("A1", "Salón A-101", 324, 512, SALON));
        g.agregarNodo(new Nodo("A2", "Salón A-102", 324, 552, SALON));
        g.agregarNodo(new Nodo("PA", "Pasillo A", 344, 532, PASILLO));
        g.agregarNodo(new Nodo("SA", "Puerta A", 344, 576, SALIDA));
        g.agregarNodo(new Nodo("B1", "Salón B-101", 388, 512, SALON));
        g.agregarNodo(new Nodo("B2", "Salón B-102", 388, 552, SALON));
        g.agregarNodo(new Nodo("PB", "Pasillo B", 380, 532, PASILLO));
        g.agregarNodo(new Nodo("SB", "Puerta B", 400, 576, SALIDA));
        g.agregarNodo(new Nodo("F1", "Bloque F", 480, 352, SALON));
        g.agregarNodo(new Nodo("G1", "Bloque G", 552, 352, SALON));
        g.agregarNodo(new Nodo("PFG", "Pasillo F-G", 516, 354, PASILLO));
        g.agregarNodo(new Nodo("SFG", "Puerta F-G", 516, 400, SALIDA));
        g.agregarNodo(new Nodo("CAF1", "Cafetería Bloque A", 252, 446, SALON));
        g.agregarNodo(new Nodo("SCAF1", "Puerta Cafetería A", 284, 464, SALIDA));
        g.agregarNodo(new Nodo("CENTRO", "Centro de la U", 530, 436, PASILLO));
        g.agregarNodo(new Nodo("PLAZA", "Plaza central", 530, 504, PASILLO));
        g.agregarNodo(new Nodo("GAL", "Galerías", 644, 644, PASILLO));
        g.agregarNodo(new Nodo("I1", "Bloque I", 670, 490, SALON));
        g.agregarNodo(new Nodo("SI", "Puerta Bloque I", 596, 490, SALIDA));
        g.agregarNodo(new Nodo("CAF2", "Cafetería Bloque I", 652, 382, SALON));
        g.agregarNodo(new Nodo("SCAF2", "Puerta Cafetería I", 660, 412, SALIDA));
        g.agregarNodo(new Nodo("P1", "Bloque P", 628, 316, SALON));
        g.agregarNodo(new Nodo("SP", "Puerta Bloque P", 600, 376, SALIDA));
        g.agregarNodo(new Nodo("LAB1", "Lab. Sistemas", 604, 336, SALON));
        g.agregarNodo(new Nodo("LAB2", "Lab. Física", 652, 340, SALON));
        g.agregarNodo(new Nodo("PLAB", "Pasillo Labs", 628, 344, PASILLO));
        g.agregarNodo(new Nodo("N3", "Camino este", 724, 430, PASILLO));
        g.agregarNodo(new Nodo("ADM", "Académico-Administrativo", 878, 640, SALON));
        g.agregarNodo(new Nodo("SADM", "Puerta Académico", 790, 690, SALIDA));
        g.agregarNodo(new Nodo("PEN", "Plaza de entrada", 758, 724, PASILLO));
        g.agregarNodo(new Nodo("ENTRA", "Entrada principal", 890, 790, SALIDA));
        g.agregarNodo(new Nodo("BIB", "Biblioteca", 640, 880, SALON));
        g.agregarNodo(new Nodo("VIR", "Virtual teca", 690, 916, SALON));
        g.agregarNodo(new Nodo("REG", "Registro y Control", 744, 880, SALON));
        g.agregarNodo(new Nodo("SSUR", "Puerta bloque sur", 696, 796, SALIDA));
        g.agregarNodo(new Nodo("LATERAL", "Entrada lateral", 216, 448, SALIDA));
        g.agregarNodo(new Nodo("PE_NORTE", "PE Norte", 470, 140, PE));
        g.agregarNodo(new Nodo("PE_ESTE", "PE Este", 850, 480, PE));
        g.agregarNodo(new Nodo("PE_SUR_B", "PE Sur Bloque B", 500, 680, PE));
        g.agregarNodo(new Nodo("PE_SO", "PE Sur-Oeste", 340, 700, PE));

        // ----- CAMINOS -----
        g.conectar("COM", "SCOM");
        g.conectar("SCOM", "FUENTE");
        g.conectar("FUENTE", "SH");
        g.conectar("H1", "SH");
        g.conectar("FUENTE", "PE_NORTE");
        g.conectar("SH", "N1");
        g.conectar("N1", "PE_NORTE");
        g.conectar("SCOM", "SCAF1");
        g.conectar("C1", "PC");
        g.conectar("C2", "PC");
        g.conectar("PC", "SC");
        g.conectar("D1", "PD");
        g.conectar("D2", "PD");
        g.conectar("PD", "SD");
        g.conectar("PC", "PD");
        g.conectar("SC", "N1");
        g.conectar("SC", "SD");
        g.conectar("SD", "E");
        g.conectar("SCAF1", "PC");
        g.conectar("SCAF1", "E");
        g.conectar("SCAF1", "LATERAL");
        g.conectar("CAF1", "SCAF1");
        g.conectar("E", "PA");
        g.conectar("E", "PB");
        g.conectar("E", "CENTRO");
        g.conectar("A1", "PA");
        g.conectar("A2", "PA");
        g.conectar("PA", "SA");
        g.conectar("B1", "PB");
        g.conectar("B2", "PB");
        g.conectar("PB", "SB");
        g.conectar("PA", "PB");
        g.conectar("SA", "PLAZA");
        g.conectar("SB", "PLAZA");
        g.conectar("SB", "PE_SUR_B");
        g.conectar("SA", "PE_SUR_B");
        g.conectar("SA", "LATERAL");
        g.conectar("F1", "PFG");
        g.conectar("G1", "PFG");
        g.conectar("PFG", "SFG");
        g.conectar("SFG", "CENTRO");
        g.conectar("SD", "CENTRO");
        g.conectar("CENTRO", "PLAZA");
        g.conectar("CENTRO", "SI");
        g.conectar("SI", "I1");
        g.conectar("SI", "PLAZA");
        g.conectar("SI", "SP");
        g.conectar("SP", "PLAB");
        g.conectar("P1", "PLAB");
        g.conectar("LAB1", "PLAB");
        g.conectar("LAB2", "PLAB");
        g.conectar("SP", "SFG");
        g.conectar("CAF2", "SCAF2");
        g.conectar("SCAF2", "SI");
        g.conectar("SCAF2", "SP");
        g.conectar("SCAF2", "N3");
        g.conectar("N3", "PE_ESTE");
        g.conectar("N3", "SADM");
        g.conectar("PLAZA", "GAL");
        g.conectar("GAL", "PE_SUR_B");
        g.conectar("GAL", "PEN");
        g.conectar("PEN", "SADM");
        g.conectar("PEN", "ENTRA");
        g.conectar("PEN", "SSUR");
        g.conectar("ADM", "SADM");
        g.conectar("SSUR", "BIB");
        g.conectar("SSUR", "VIR");
        g.conectar("SSUR", "REG");
        g.conectar("PE_SO", "LATERAL");
        g.conectar("PE_SO", "SA");
        g.conectar("CENTRO", "N3", 1.4);

        return g;
    }
}
