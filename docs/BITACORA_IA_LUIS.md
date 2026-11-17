# Bitácora de uso de IA · Luis Ángel Ospino Castro

Proyecto: **Net Path UPC** (navegación de emergencias en el campus, Universidad Popular del Cesar).
Este documento registra lo que le pedí a la inteligencia artificial y lo que ella hizo. Breiner y Esbel llevan su propia bitácora.

- **Herramienta:** Claude (Anthropic), desde la aplicación de Claude.
- **Rama con mis commits:** `rama-capas-servicios-http`.

## 1. Lo que pedí y lo que hizo la IA

| # | Lo que le pedí | Lo que hizo la IA |
| --- | --- | --- |
| 1 | Separar lo que ven los estudiantes de lo que controla el administrador | Agregó el inicio de sesión del administrador con clave, el límite de intentos fallidos y las cabeceras de seguridad. Los estudiantes solo ven la ruta durante una emergencia |
| 2 | Preparar el proyecto para ponerlo en internet y que los estudiantes entren desde cualquier dispositivo | Agregó un `Dockerfile` para hosting, la clave por variable de entorno y la configuración para funcionar detrás de HTTPS |
| 3 | Un documento técnico para estudiar y explicarle al profe por qué se hizo cada cosa | Redactó el documento técnico (algoritmo, arquitectura, seguridad, pruebas, preguntas probables y reparto del equipo) |
| 4 | Pasos para que cada integrante (Luis, Esbel y Breiner) hiciera sus propios commits en GitHub, con el reparto de archivos | Armó la guía de Git, las ramas por persona y los comandos de cada uno. Ayudó con los errores que aparecieron: dirección del repositorio mal escrita, un `git init` en la carpeta equivocada y una carpeta anidada en el repositorio |
| 5 | Cómo abrir el proyecto en NetBeans | Explicó los pasos y revisó la estructura del proyecto en NetBeans a partir de una captura |
| 6 | Cuántas clases tiene el proyecto, si ya aplicaba GRASP y SOLID y cómo estaban compuestas las capas | Respondió con lo que tenía el código en ese momento |
| 7 | Rehacer el proyecto en arquitectura en capas, aplicando GRASP básicos y avanzados y SOLID (el profe pidió "uno, dos y tres") | Reorganizó el código en 4 capas (modelo, datos, negocio, presentación) y aplicó los patrones. Interpretó "SOLID uno, dos y tres" como S, O y L. Escribió la documentación de la arquitectura y una prueba que vigila que las capas no se mezclen |
| 8 | Actualizar el documento técnico y la guía de Git con el cambio | Actualizó el documento técnico y escribió `GUIA_GIT_REFACTOR.md` con las ramas y los commits nuevos |
| 9 | Conectar el proyecto a una base de datos y explicarme las opciones | Explicó las opciones. Elegimos PostgreSQL. Implementó el acceso a PostgreSQL en la capa de datos, con pruebas, y actualizó el README, los scripts y el documento técnico |
| 10 | Qué diferencia hace tener la base de datos y cómo instalar PostgreSQL en Windows | Explicó la diferencia y los pasos del instalador y de pgAdmin |
| 11 | Un bloc de notas con los pasos para que Breiner y Esbel suban su parte | Escribió `PASOS_BREINER_Y_ESBEL.txt` con sus comandos |
| 12 | Hacer mis commits y subirlos a GitHub | Con mi cuenta de GitHub vinculada y a petición mía, preparó y subió los 8 commits de mi rama. Yo abrí el Pull Request |
| 13 | Esta bitácora | La escribió a partir de lo anterior |

## 2. Lo que verificó la IA

Durante el trabajo, la IA ejecutó el código en su propio entorno:

- Las pruebas automáticas: 59 sin base de datos y 68 con una base PostgreSQL de pruebas.
- Una comparación del comportamiento del programa antes y después del refactor.
- Una prueba de la interfaz en un navegador automatizado.
- Una prueba de que la emergencia sobrevive a un reinicio del servidor con PostgreSQL.

## 3. Errores y límites de la IA

- Una de las pruebas que escribió tenía mal el resultado esperado (esperaba 5 m y el camino medía 10 m). Falló al correrla y se corrigió.
- Interpretó por su cuenta "SOLID uno, dos y tres" como S, O y L.
- Limitaciones que ella misma señaló: `web/app.js` sigue siendo un solo archivo grande, las pruebas no usan JUnit, la base supone un solo servidor escribiendo y las sesiones de administrador no se guardan en la base.

## 4. Lo que la IA no hizo

- No hizo los commits de Breiner ni de Esbel.
- Los 8 commits de mi rama los preparó y subió con mi cuenta, a petición mía. Llevan mi nombre como autor y una línea de coautor de Claude.
- No instaló nada en mi computador.
