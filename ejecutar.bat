@echo off
rem Compila, corre las pruebas y levanta el servidor.  Uso: ejecutar.bat [puerto]
rem Con la variable DATABASE_URL usa PostgreSQL; sin ella guarda todo en memoria.
chcp 65001 >nul
cd /d "%~dp0"
set PUERTO=%1
if "%PUERTO%"=="" set PUERTO=8080

if not exist out mkdir out
echo Compilando...
javac -encoding UTF-8 -d out -sourcepath src src\evacuacion\Main.java src\evacuacion\pruebas\Pruebas.java
if errorlevel 1 (
  echo Error al compilar. Revisa que Java JDK 17 o superior este instalado: java -version / javac -version
  pause
  exit /b 1
)

echo Pruebas...
java -Dstdout.encoding=UTF-8 -cp "out;lib\postgresql-42.7.2.jar" evacuacion.pruebas.Pruebas
if errorlevel 1 (
  echo Alguna prueba fallo
  pause
  exit /b 1
)

echo.
echo Estudiantes:     http://localhost:%PUERTO%
echo Administradores: http://localhost:%PUERTO%/admin.html     (Ctrl+C para detener)
java -Dstdout.encoding=UTF-8 -cp "out;lib\postgresql-42.7.2.jar" evacuacion.Main %PUERTO% web
pause
