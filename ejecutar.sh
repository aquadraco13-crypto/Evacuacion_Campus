#!/usr/bin/env bash
# Compila, corre las pruebas y levanta el servidor.  Uso:  ./ejecutar.sh [puerto]
# Con la variable DATABASE_URL usa PostgreSQL; sin ella guarda todo en memoria.
cd "$(dirname "$0")" || exit 1
PUERTO="${1:-8080}"

mkdir -p out
echo "Compilando..."
javac -encoding UTF-8 -d out -sourcepath src src/evacuacion/Main.java src/evacuacion/pruebas/Pruebas.java \
  || { echo "Error al compilar"; exit 1; }

echo "Pruebas..."
java -Dstdout.encoding=UTF-8 -cp "out:lib/postgresql-42.7.2.jar" evacuacion.pruebas.Pruebas || { echo "Alguna prueba falló"; exit 1; }

echo
echo "Estudiantes:     http://localhost:$PUERTO"
echo "Administradores: http://localhost:$PUERTO/admin.html     (Ctrl+C para detener)"
java -Dstdout.encoding=UTF-8 -cp "out:lib/postgresql-42.7.2.jar" evacuacion.Main "$PUERTO" web
