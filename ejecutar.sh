#!/usr/bin/env bash
# Compila, corre las pruebas y levanta el servidor.  Uso:  ./ejecutar.sh [puerto]
cd "$(dirname "$0")" || exit 1
PUERTO="${1:-8080}"

mkdir -p out
echo "Compilando..."
javac -encoding UTF-8 -d out src/*.java || { echo "Error al compilar"; exit 1; }

echo "Pruebas del algoritmo..."
java -Dstdout.encoding=UTF-8 -cp out Pruebas || { echo "Alguna prueba falló"; exit 1; }

echo
echo "Estudiantes:     http://localhost:$PUERTO"
echo "Administradores: http://localhost:$PUERTO/admin.html     (Ctrl+C para detener)"
java -Dstdout.encoding=UTF-8 -cp out Servidor "$PUERTO" web
