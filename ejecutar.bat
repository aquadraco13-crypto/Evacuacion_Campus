@echo off
rem Compila, corre las pruebas y levanta el servidor.  Uso: ejecutar.bat [puerto]
chcp 65001 >nul
cd /d "%~dp0"
set PUERTO=%1
if "%PUERTO%"=="" set PUERTO=8080

if not exist out mkdir out
echo Compilando...
javac -encoding UTF-8 -d out src\*.java
if errorlevel 1 (
  echo Error al compilar. Revisa que Java JDK 17 o superior este instalado: java -version / javac -version
  pause
  exit /b 1
)

echo Pruebas del algoritmo...
java -Dstdout.encoding=UTF-8 -cp out Pruebas
if errorlevel 1 (
  echo Alguna prueba fallo
  pause
  exit /b 1
)

echo.
echo Estudiantes:     http://localhost:%PUERTO%
echo Administradores: http://localhost:%PUERTO%/admin.html     (Ctrl+C para detener)
java -Dstdout.encoding=UTF-8 -cp out Servidor %PUERTO% web
pause
